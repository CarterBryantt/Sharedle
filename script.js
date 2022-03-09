import {byDate as wordles, valid as validWords, all as allWords, futureWords} from "./word-lists.js"; // Import all word lists from word list file

// ------------------------------------------------------------------------
// INPUT
// ------------------------------------------------------------------------
let disableInput = false;

let currentGuess = ""; // String to keep track of the current word being input
let guessCount = 0; // Number to keep track of how many guesses the user has made

let wordleIndex = Math.floor(Math.random() * wordles.length);
let wordle = wordles[wordleIndex]; // Pick a random word from list of wordles
document.getElementById('wordle').innerHTML = `The word was: ${wordle.toUpperCase()}`;
console.log(wordle)

let activeScreen = 0; // Tells which screen should pop up (start or end) 0 = start, 1 = end

document.querySelectorAll('.close-button').forEach(e => e.addEventListener('click', showHideScreen)); // Get close screen buttons and add click event
document.getElementById('menu-button').addEventListener('click', showHideScreen); // Get close screen buttons and add click event

document.getElementById('wordle-index').addEventListener('input', selectWordle);

let letterDivs = document.querySelectorAll('.letter-box'); // Get letter boxes

let keyDivs = document.querySelectorAll('.key'); // Get all keyboard keys

for (let i = 0; i < keyDivs.length; i++) {
	keyDivs[i].addEventListener('click', keyPress);
} // Add event listener to all key divs to listen for mouse clicks

document.getElementById('restart-button').addEventListener('click', restartGame); // Reset game when the restart button is clicked

document.getElementById('share-button').addEventListener('click', share); // Bring up share screen to share emojis

document.addEventListener('keydown', keyPress); // Add event listener to the document to listen for keypresses

function keyPress(e) {
	if (disableInput || document.activeElement == document.getElementById('password')) return; // If input is disabled because the end screen is displayed or if the password is being entered, exit function
	
	if (e.type == "click") {
		let keyDiv = e.target; // Get div clicked

		if (keyDiv.classList.contains('misc-key')) {
			if (keyDiv.id == "backspace" && currentGuess.length != 0) currentGuess = currentGuess.slice(0, -1); // Check if the key pressed is the backspace key, if it is, remove the last letter from the word. Also make sure there is at least 1 letter in the current guess

			if (keyDiv.innerHTML == "ENTER" && currentGuess.length == 5) guessWord(currentGuess.toLowerCase()); // Check if the key pressed is the enter key, if it is, run the search algorithm on the word. Also check if the current guess is at least 5 letters long
			updateWord(); // Display new word
			return;
		} // Check if key pressed is a miscellaneous key or if it is the backspace icon, if it is don't add text to input word

		if (currentGuess.length != 5) currentGuess += keyDiv.innerHTML; // If current guess is not already five letters long and the div key pressed is a letter, add the letter to the current guess

		updateWord(); // Display new word
	} // If the event that triggered the function is a click event
	if (e.type == "keydown") {
		let key = e.code; // Get key pressed
		
		if (key.slice(0,3) != "Key" && key != "Enter" && key != "Backspace") return; // If key pressed is not a letter key, enter, or backspace, exit function

		if (key == "Backspace" && currentGuess.length != 0) currentGuess = currentGuess.slice(0, -1); // If there is at least one letter, delete the last letter in the current guess
		
		if (key == "Enter" && currentGuess.length == 5) guessWord(currentGuess.toLowerCase()); // If there are at least five letters, enter word

		if (currentGuess.length != 5 && key != "Enter" && key != "Backspace") currentGuess += key.slice(3); // If the key pressed is not enter or backspace, remove "Key" from the string so that you are just left with the letter (KeyA - Key = A) and add it to the current guess

		if (guessCount != 6) updateWord(); // Display new word
	} // If the event that triggered the function is a keypress event
} // Register key presses from keyboard and update word

function colorKey(letter, state) {
	for (let i = 0; i < keyDivs.length; i++) {
		if (keyDivs[i].innerHTML.toLowerCase() == letter) {
			keyDivs[i].classList.add("dark-key");
			switch(state) {
				case "absent":
					if (keyDivs[i].style.background != "var(--correct)" &&  keyDivs[i].style.background != "var(--present)") {
						keyDivs[i].style.background = "var(--absent)";
					} // Color the pressed key absent, only if the key is not already correct or present
					break;
				case "present":
					if (keyDivs[i].style.background != "var(--correct)") {
						keyDivs[i].style.background = "var(--present)";
					} // Color the pressed key present, only if the key is not already correct
					break;
				case "correct":
					keyDivs[i].style.background = "var(--correct)"; // Color the pressed key correct
					break;
			}
		}
	}
} // Color keyboard key a given state color

let lastLength = 0;
function updateWord() {
	for (let i = 0; i < 5; i++) {
		letterDivs[(5*guessCount)+i].innerHTML = currentGuess[i] || "";
		
		// Box animation
		if (currentGuess.length > lastLength) {
			letterDivs[(5*guessCount)+lastLength].classList.add("pop");
		} else if (currentGuess != 5) {
			for (let i = 0; i < 5; i++) {
				letterDivs[(5*guessCount)+i].classList.remove("pop"); 
			}
		} // If the word gained a letter, add animation class to letter box, else, remove it
		
		// Remove shake animation
		if (currentGuess.length < lastLength) {
			letterDivs[(5*guessCount)+i].classList.remove("shake-0"); 
			letterDivs[(5*guessCount)+i].classList.remove("shake-1");
		} // If the letter box has the shake class and the word is shrinking in length, remove it
	} // If the letter box has the shake class and decreased in length, remove the class
	lastLength = currentGuess.length;
} // Update word using key presses

function showHideScreen() {
	document.getElementById('start-screen').style.display = ["block", "none"][activeScreen]; // If active screen = 0, display start screen
	document.getElementById('end-screen').style.display = ["block", "none"][1^activeScreen]; // If active screen = 1, display end screen
	
	let overlay = document.querySelector('.overlay');
	overlay.style.display = overlay.style.display == "block" ? "none" : "block"; // Flip display state
} // Shows/hides the currently active screen (flips between display states)

function selectWordle(e) {
	if (currentGuess > 0) return; // If the player has already started playing, exit functon
	
	wordleIndex = e.target.value;
	wordle = wordles[wordleIndex];
	document.getElementById('wordle').innerHTML = `The word was: ${wordle.toUpperCase()}`;
}

// ------------------------------------------------------------------------
// ALGORITHM
// ------------------------------------------------------------------------
function guessWord(guess) {
	if (!allWords.includes(guess)) {
		for (let i = 0; i < 5; i++) {
			let flip = letterDivs[(5*guessCount)+i].classList.contains("shake-0") ? 1 : 0; // Get animation number, so we can flip to the other one
			letterDivs[(5*guessCount)+i].classList.remove(`shake-${1^flip}`);
			letterDivs[(5*guessCount)+i].classList.add(`shake-${flip}`);
		}
		return;
	}; // If guess is not a valid word, shake letters and exit function
	
	if (guess == wordle) {
		for (let i = 0; i < 5; i++) {
			letterDivs[(5*guessCount)+i].style.backgroundColor = "var(--correct)";
		} // Color all boxes correct
		activeScreen = 1;
		showHideScreen();
		disableInput = true;
	} // If the guess is the wordle, the player wins
	
	let tempWordle = wordle.split(''); // Temorary wordle that we can remove letters from so that we don't count letters more than once
	let correctIndicies = []; // List of correctly placed letter's indicies
	for (let i = 0; i < 5; i++) {
		if (wordle.includes(guess[i])) {
			if (wordle[i] == guess[i]) {
				letterDivs[(5*guessCount)+i].style.backgroundColor = "var(--correct)"; // Color the square correct
				colorKey(guess[i], "correct"); // Color the key with the corresponding letter correct
				correctIndicies.push(i); // Add index to list of correct indicies
				tempWordle.splice(tempWordle.indexOf(wordle[i]), 1); // Remove letter from temporary wordle
			} // If the two letters are in the same place
			continue; // Skip current iteration
		} // If the current letter is in the wordle
		
		// If the current letter is not in the wordle because we haven't skipped the current iteration
		letterDivs[(5*guessCount)+i].style.backgroundColor = "var(--absent)"; // Color the square absent
		colorKey(guess[i], "absent"); // Color the key with the corresponding letter absent
	} // Check for correct and absent letters
	
	for (let i = 0; i < 5; i++) {
		if (tempWordle.includes(guess[i]) && !correctIndicies.includes(i)) {
			letterDivs[(5*guessCount)+i].style.backgroundColor = "var(--present)"; // Color the square correct
			colorKey(guess[i], "present"); // Color the key with the corresponding letter absent
			tempWordle.splice(tempWordle.indexOf(guess[i]), 1); // Remove letter from temporary wordle
		} // If the current letter is in the wordle and the current index isn't a letter that is already correctly placed
	} // Check for present letters
	
	if (guessCount == 5) {
		activeScreen = 1;
		showHideScreen();
		disableInput = true;
	} // This was the player's last guess and they didn't win
	
	guessCount++; // Increase number of guesses made
	currentGuess = ""; // Clear current guess
}

function restartGame() {
	guessCount = 0;
	currentGuess = "";
	disableInput = false;
	activeScreen = 0;
	wordle = wordles[Math.floor(Math.random() * wordles.length)]; // Pick a new random word from list of wordles
	document.getElementById('wordle').innerHTML = `The word was: ${wordle.toUpperCase()}`;
	
	document.getElementById('end-screen').style.display = "none";
	
	for (let i = 0; i < keyDivs.length; i++) {
		if (keyDivs[i].classList.contains("dark-key")) {
			keyDivs[i].classList.remove("dark-key");
			keyDivs[i].style.background = "hsl(0, 0%, 95%)";
		}
	} // Reset keyboard colors
	
	for (let i = 0; i < letterDivs.length; i++) {
		letterDivs[i].innerHTML = "";
		letterDivs[i].style.backgroundColor = "var(--absent)";
	} // Clear letter boxes
}

function generateEmojis() {
	let emojis = [];
	for (let i = 0; i < letterDivs.length; i++) {
		if (letterDivs[i].innerHTML = "") break; // If there isn't a letter, exit for loop
		switch(letterDivs[i].style.backgroundColor) {
			case "var(--absent)":
				emojis += i % 5 != 4 ? "\u2B1B" : "\u2B1B\n"; // ⬛
				break;
			case "var(--present)":
				emojis += i % 5 != 4 ? String.fromCodePoint(0x1F7E8) : String.fromCodePoint(0x1F7E8) + "\n"; // 🟨
				break;
			case "var(--correct)":
				emojis += i % 5 != 4 ? String.fromCodePoint(0x1F7E9) : String.fromCodePoint(0x1F7E9) + "\n"; // 🟩
				break;
		}
	}
	return emojis;
}

async function share() {
	let emojis = generateEmojis();
	console.log(emojis)
	try {
		await navigator.share({
			title: 'Wordle',
			text: `I was able to solve Wordle #${wordleIndex} in ${guessCount}/6 tries!\nHow about you?\n${emojis}`,
			url: 'https://codepen.io/CarterBryant/full/GROPrEN'});
	} catch(err) {
		console.log(err);
	}
}