use std::{cmp::Ordering, io};

use rand::Rng;

fn main() {
    println!("Random Guessing Number!");
    let random_number = rand::rng().random_range(0..=100);
    loop {
        println!("Enter Your Guess:");
        let guess = get_input();
        println!("Your Guess is {}...!", guess);
        match guess.cmp(&random_number) {
            Ordering::Less => println!("Guessed number is too small!"),
            Ordering::Greater => println!("Guessed number is too big!"),
            Ordering::Equal => {
                println!("You win!");
                break;
            }
        }
    }
}
fn get_input() -> u32 {
    let mut input = String::new();
    io::stdin()
        .read_line(&mut input)
        .expect("Failed to read the input");
    let input: u32 = input.trim().parse().expect("failed to parse");
    input
}
