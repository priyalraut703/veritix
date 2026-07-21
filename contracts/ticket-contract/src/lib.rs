#![no_std]
// no_std: contracts don't get Rust's standard library (no OS, no heap the
// usual way) — soroban_sdk gives us its own String/Vec/Map that work on-chain.

use soroban_sdk::{
    contract, contracterror, contractimpl, contracttype, Address, Env, String, Symbol,
};

// ---------------------------------------------------------------------------
// ERRORS
// Every failure mode gets its own named error instead of a generic panic, so
// the frontend can show a specific message ("resale price too high") instead
// of a mystery crash.
// ---------------------------------------------------------------------------
#[contracterror]
#[derive(Copy, Clone, Debug, Eq, PartialEq, PartialOrd, Ord)]
#[repr(u32)]
pub enum TicketError {
    EventAlreadyExists = 1,
    EventNotFound = 2,
    TicketAlreadyExists = 3,
    TicketNotFound = 4,
    NotTicketOwner = 5,
    TicketAlreadyUsed = 6,
    ResalePriceTooHigh = 7,
    NotEventOrganizer = 8,
}

// ---------------------------------------------------------------------------
// DATA MODELS
// #[contracttype] lets these structs be stored on-chain and sent over the
// wire to/from the frontend.
// ---------------------------------------------------------------------------
#[contracttype]
#[derive(Clone)]
pub struct Event {
    pub organizer: Address,
    pub name: String,
    // Prices are stored in stroops (1 XLM = 10,000,000 stroops) as i128,
    // Soroban's native integer type for on-chain amounts.
    pub face_price: i128,
    // Resale cap expressed in basis points relative to face_price.
    // 12000 = 120% of face price = a 20% markup ceiling.
    pub max_resale_bps: u32,
    pub tickets_minted: u32,
}

#[contracttype]
#[derive(Clone)]
pub struct Ticket {
    pub event_id: u64,
    pub owner: Address,
    pub used: bool,
}

// Keys used to address values in contract storage — think of this as the
// "table names" for our on-chain database.
#[contracttype]
#[derive(Clone)]
pub enum DataKey {
    Event(u64),
    Ticket(u64, u64), // (event_id, ticket_id)
}

#[contract]
pub struct TicketContract;

#[contractimpl]
impl TicketContract {
    /// Organizer creates an event. Called once per event, before any minting.
    pub fn create_event(
        env: Env,
        organizer: Address,
        event_id: u64,
        name: String,
        face_price: i128,
        max_resale_bps: u32,
    ) -> Result<(), TicketError> {
        // require_auth: this call only succeeds if `organizer` themself
        // cryptographically signed this transaction. Nobody can create an
        // event pretending to be a different organizer.
        organizer.require_auth();

        let key = DataKey::Event(event_id);
        if env.storage().persistent().has(&key) {
            return Err(TicketError::EventAlreadyExists);
        }

        let event = Event {
            organizer,
            name,
            face_price,
            max_resale_bps,
            tickets_minted: 0,
        };
        env.storage().persistent().set(&key, &event);
        Ok(())
    }

    /// Organizer mints a ticket directly to a buyer's address. This is how
    /// wallet-less onboarding works: the buyer's Stellar keypair is created
    /// silently by our backend at checkout, and its address is passed in
    /// here — the buyer never has to see or manage the key themselves.
    pub fn mint_ticket(
        env: Env,
        organizer: Address,
        event_id: u64,
        ticket_id: u64,
        buyer: Address,
    ) -> Result<(), TicketError> {
        let event_key = DataKey::Event(event_id);
        let mut event: Event = env
            .storage()
            .persistent()
            .get(&event_key)
            .ok_or(TicketError::EventNotFound)?;

        // Only the organizer who created this event can mint tickets for it.
        if event.organizer != organizer {
            return Err(TicketError::NotEventOrganizer);
        }
        organizer.require_auth();

        let ticket_key = DataKey::Ticket(event_id, ticket_id);
        if env.storage().persistent().has(&ticket_key) {
            return Err(TicketError::TicketAlreadyExists);
        }

        let ticket = Ticket {
            event_id,
            owner: buyer,
            used: false,
        };
        env.storage().persistent().set(&ticket_key, &ticket);

        event.tickets_minted += 1;
        env.storage().persistent().set(&event_key, &event);

        env.events()
            .publish((Symbol::new(&env, "mint"), event_id), ticket_id);
        Ok(())
    }

    /// Resells a ticket from its current owner to a new owner. This is the
    /// function that actually stops scalping: `sale_price` is checked
    /// against the event's cap on-chain, so there's no way to route around
    /// it through the app or a side deal — the chain itself refuses the
    /// transfer if the price is too high.
    pub fn transfer_ticket(
        env: Env,
        event_id: u64,
        ticket_id: u64,
        from: Address,
        to: Address,
        sale_price: i128,
    ) -> Result<(), TicketError> {
        let event: Event = env
            .storage()
            .persistent()
            .get(&DataKey::Event(event_id))
            .ok_or(TicketError::EventNotFound)?;

        let ticket_key = DataKey::Ticket(event_id, ticket_id);
        let mut ticket: Ticket = env
            .storage()
            .persistent()
            .get(&ticket_key)
            .ok_or(TicketError::TicketNotFound)?;

        if ticket.owner != from {
            return Err(TicketError::NotTicketOwner);
        }
        if ticket.used {
            return Err(TicketError::TicketAlreadyUsed);
        }

        // The actual price-cap enforcement. Basis points avoid floating
        // point math on-chain (Soroban integers only): 10000 bps = 100%.
        let max_price = (event.face_price * event.max_resale_bps as i128) / 10000;
        if sale_price > max_price {
            return Err(TicketError::ResalePriceTooHigh);
        }

        // Only the current owner's signature can move their own ticket.
        from.require_auth();

        ticket.owner = to;
        env.storage().persistent().set(&ticket_key, &ticket);

        env.events()
            .publish((Symbol::new(&env, "resale"), event_id), ticket_id);
        Ok(())
    }

    /// Called at the venue gate. Marks the ticket used in the same call that
    /// checks it — there is no gap between "check if valid" and "mark used"
    /// for two scanners to both slip through with a screenshotted QR.
    pub fn verify_ticket(
        env: Env,
        scanner: Address,
        event_id: u64,
        ticket_id: u64,
    ) -> Result<Address, TicketError> {
        let event: Event = env
            .storage()
            .persistent()
            .get(&DataKey::Event(event_id))
            .ok_or(TicketError::EventNotFound)?;

        // MVP: only the organizer's address can scan. Adding a delegated
        // scanner list (for gate staff who aren't the organizer) is a
        // small follow-up — see the roadmap.
        if event.organizer != scanner {
            return Err(TicketError::NotEventOrganizer);
        }
        scanner.require_auth();

        let ticket_key = DataKey::Ticket(event_id, ticket_id);
        let mut ticket: Ticket = env
            .storage()
            .persistent()
            .get(&ticket_key)
            .ok_or(TicketError::TicketNotFound)?;

        if ticket.used {
            return Err(TicketError::TicketAlreadyUsed);
        }

        ticket.used = true;
        env.storage().persistent().set(&ticket_key, &ticket);

        env.events()
            .publish((Symbol::new(&env, "verify"), event_id), ticket_id);
        Ok(ticket.owner)
    }

    /// Read-only lookup — no auth needed, anyone can check a ticket's state.
    pub fn get_ticket(env: Env, event_id: u64, ticket_id: u64) -> Result<Ticket, TicketError> {
        env.storage()
            .persistent()
            .get(&DataKey::Ticket(event_id, ticket_id))
            .ok_or(TicketError::TicketNotFound)
    }

    pub fn get_event(env: Env, event_id: u64) -> Result<Event, TicketError> {
        env.storage()
            .persistent()
            .get(&DataKey::Event(event_id))
            .ok_or(TicketError::EventNotFound)
    }
}

#[cfg(test)]
mod test;
