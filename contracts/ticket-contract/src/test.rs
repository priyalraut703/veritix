#![cfg(test)]

use super::*;
use soroban_sdk::testutils::Address as _;
use soroban_sdk::Env;

fn setup(env: &Env) -> (Address, TicketContractClient) {
    let contract_id = env.register_contract(None, TicketContract);
    let client = TicketContractClient::new(env, &contract_id);
    let organizer = Address::generate(env);
    (organizer, client)
}

#[test]
fn mint_and_verify_happy_path() {
    let env = Env::default();
    env.mock_all_auths();
    let (organizer, client) = setup(&env);
    let buyer = Address::generate(&env);

    client.create_event(
        &organizer,
        &1,
        &String::from_str(&env, "Mood Indigo"),
        &50_0000000, // 50 XLM in stroops
        &12000,      // 20% resale cap
    );

    client.mint_ticket(&organizer, &1, &1001, &buyer);

    let ticket = client.get_ticket(&1, &1001);
    assert_eq!(ticket.owner, buyer);
    assert!(!ticket.used);

    let owner = client.verify_ticket(&organizer, &1, &1001);
    assert_eq!(owner, buyer);

    let ticket_after = client.get_ticket(&1, &1001);
    assert!(ticket_after.used);
}

#[test]
fn duplicate_scan_is_rejected() {
    let env = Env::default();
    env.mock_all_auths();
    let (organizer, client) = setup(&env);
    let buyer = Address::generate(&env);

    client.create_event(&organizer, &1, &String::from_str(&env, "Fest"), &1000_0000000, &12000);
    client.mint_ticket(&organizer, &1, &1, &buyer);
    client.verify_ticket(&organizer, &1, &1);

    // Second scan of the same ticket must fail — this is the guarantee that
    // stops a screenshotted QR from letting two people in.
    let result = client.try_verify_ticket(&organizer, &1, &1);
    assert_eq!(result, Err(Ok(TicketError::TicketAlreadyUsed)));
}

#[test]
fn resale_above_cap_is_rejected() {
    let env = Env::default();
    env.mock_all_auths();
    let (organizer, client) = setup(&env);
    let buyer = Address::generate(&env);
    let reseller_target = Address::generate(&env);

    // Face price 100 XLM, cap 12000 bps = max resale of 120 XLM.
    client.create_event(&organizer, &1, &String::from_str(&env, "Fest"), &100_0000000, &12000);
    client.mint_ticket(&organizer, &1, &1, &buyer);

    // Attempting to resell at 200 XLM (way above the 120 XLM cap) must fail.
    let result = client.try_transfer_ticket(&1, &1, &buyer, &reseller_target, &200_0000000);
    assert_eq!(result, Err(Ok(TicketError::ResalePriceTooHigh)));

    // Reselling at exactly the cap succeeds.
    client.transfer_ticket(&1, &1, &buyer, &reseller_target, &120_0000000);
    let ticket = client.get_ticket(&1, &1);
    assert_eq!(ticket.owner, reseller_target);
}

#[test]
fn only_organizer_can_mint() {
    let env = Env::default();
    env.mock_all_auths();
    let (organizer, client) = setup(&env);
    let stranger = Address::generate(&env);
    let buyer = Address::generate(&env);

    client.create_event(&organizer, &1, &String::from_str(&env, "Fest"), &100_0000000, &12000);

    let result = client.try_mint_ticket(&stranger, &1, &1, &buyer);
    assert_eq!(result, Err(Ok(TicketError::NotEventOrganizer)));
}
