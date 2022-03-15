import {byDate as wordles, valid as validWords, all as allWords, futureWords} from "./word-lists.js"; // Import all word lists from word list file

// ------------------------------------------------------------------------
// INPUT
// ------------------------------------------------------------------------
let disableInput,
	activeScreen,
	currentGuess,
	guessCount,
	lastLength;

let urlIndex,
	wordleIndex,
	wordle;

let letterDivs, keyDivs;

function setup() {
	{
		disableInput = false; // Boolean value that won't allow the user to type letters if true
		activeScreen = JSON.parse(localStorage.getItem('active-screen')) || 0; // Tells which screen should pop up (start or end) 0 = start, 1 = end
		currentGuess = ""; // String to keep track of the current word being input
		guessCount = 0; // Number to keep track of how many guesses the user has made
		lastLength = 0; // Last currentWord length; variable used in `update` function

		urlIndex = new URLSearchParams(window.location.search).get('index'); // Get index from search params
		wordleIndex = urlIndex || Math.floor(Math.random() * wordles.length); // Make wordleIndex urlIndex if a urlIndex was provided, otherwise generate a random index
		wordle = wordles[wordleIndex]; // Pick a random word from list of wordles
	} // Set up variables 

	{	
		document.getElementById('wordle').innerHTML = `The word was: ${wordle.toUpperCase()}`;
		
		showHideScreen();

		document.querySelectorAll('.close-button').forEach(e => e.addEventListener('click', showHideScreen)); // Get close screen buttons and add click event
		document.getElementById('menu-button').addEventListener('click', showHideScreen); // Get close screen buttons and add click event

		letterDivs = document.querySelectorAll('.letter-box'); // Get letter boxes
		keyDivs = document.querySelectorAll('.key'); // Get all keyboard keys
		for (let i = 0; i < keyDivs.length; i++) {
			keyDivs[i].addEventListener('click', keyPress);
		} // Add event listener to all key divs to listen for mouse clicks

		document.querySelectorAll('.restart-button').forEach(e => e.addEventListener('click', restartGame)); // Reset game when the restart button is clicked
		document.getElementById('share-button').addEventListener('click', share); // Bring up share screen to share emojis
		document.addEventListener('keydown', keyPress); // Add event listener to the document to listen for keypresses
	} // Add event listeners to divs

	fillInGuesses(); // Using the local storage, if the player is already playing a game, fill that game data in
} // Get game setup
window.onload = setup();


function keyPress(e) {
	if (disableInput || document.activeElement == document.getElementById('password')) return; // If input is disabled because the end screen is displayed or if the password is being entered, exit function
	
	if (e.type == "click") {
		let keyDiv = e.target; // Get div clicked

		if (keyDiv.classList.contains('misc-key')) {
			if (keyDiv.id == "backspace" && currentGuess.length != 0) currentGuess = currentGuess.slice(0, -1); // Check if the key pressed is the backspace key, if it is, remove the last letter from the word. Also make sure there is at least 1 letter in the current guess

			if (keyDiv.innerHTML == "ENTER" && currentGuess.length == 5) guessWord(currentGuess.toLowerCase()); // Check if the key pressed is the enter key, if it is, run the search algorithm on the word. Also check if the current guess is at least 5 letters long
			updateWord(currentGuess, guessCount); // Display new word
			return;
		} // Check if key pressed is a miscellaneous key or if it is the backspace icon, if it is don't add text to input word

		if (currentGuess.length != 5) currentGuess += keyDiv.innerHTML; // If current guess is not already five letters long and the div key pressed is a letter, add the letter to the current guess

		updateWord(currentGuess, guessCount); // Display new word
	} // If the event that triggered the function is a click event
	if (e.type == "keydown") {
		let key = e.code; // Get key pressed
		
		if (key.slice(0,3) != "Key" && key != "Enter" && key != "Backspace") return; // If key pressed is not a letter key, enter, or backspace, exit function

		if (key == "Backspace" && currentGuess.length != 0) currentGuess = currentGuess.slice(0, -1); // If there is at least one letter, delete the last letter in the current guess
		
		if (!e.repeat && key == "Enter" && currentGuess.length == 5) guessWord(currentGuess.toLowerCase()); // If the key is not being held down there are at least five letters, enter word

		if (currentGuess.length != 5 && key != "Enter" && key != "Backspace") currentGuess += key.slice(3); // If the key pressed is not enter or backspace, remove "Key" from the string so that you are just left with the letter (KeyA - Key = A) and add it to the current guess

		if (guessCount != 6) updateWord(currentGuess, guessCount); // Display new word
	} // If the event that triggered the function is a keypress event
} // Register key presses from keyboard and update word

function colorKey(letter, state) {
	for (let i = 0; i < keyDivs.length; i++) {
		if (keyDivs[i].innerHTML == letter) {
			keyDivs[i].classList.add("dark-key");
			switch(state) {
				case "var(--absent)":
					if (keyDivs[i].style.background != "var(--correct)" &&  keyDivs[i].style.background != "var(--present)") {
						keyDivs[i].style.background = "var(--absent)";
					} // Color the pressed key absent, only if the key is not already correct or present
					break;
				case "var(--present)":
					if (keyDivs[i].style.background != "var(--correct)") {
						keyDivs[i].style.background = "var(--present)";
					} // Color the pressed key present, only if the key is not already correct
					break;
				case "var(--correct)":
					keyDivs[i].style.background = "var(--correct)"; // Color the pressed key correct
					break;
			}
		}
	}
} // Color keyboard key a given state color


function updateWord(guess, row) {
	for (let i = 0; i < 5; i++) {
		letterDivs[(5*row)+i].innerHTML = guess[i] || "";

		letterDivs[(5*row)+i].style.borderColor = guess[i] ? "var(--border-light)" : "var(--border-dark)"; // If theres a letter in the letter box, color the border light
		
		// Box animation
		if (guess.length == lastLength+1) {
			letterDivs[(5*row)+lastLength].classList.add("pop");
		} else if (guess != 5) {
			for (let i = 0; i < 5; i++) {
				letterDivs[(5*row)+i].classList.remove("pop");
			}
		} // If the word gained a letter, add animation class to letter box, else, remove it
		
		// Remove shake animation
		if (guess.length < lastLength) {
			letterDivs[(5*row)+i].classList.remove("shake-0"); 
			letterDivs[(5*row)+i].classList.remove("shake-1");
		} // If the letter box has the shake class and the word is shrinking in length, remove it
	} // If the letter box has the shake class and decreased in length, remove the class
	lastLength = guess.length;
} // Update word using key presses


function showHideScreen() {
	let screens = document.querySelectorAll('.screen');
	for (let i = 0; i < screens.length; i++) {
		if (i == activeScreen) { screens[i].style.display = "flex"; break; }
		screens[i].style.display = "none";
	}

	let overlay = document.querySelector('.overlay');
	switch(window.getComputedStyle(overlay).display) {
		case "block":
			overlay.style.display = "none";
			if (activeScreen != 2) disableInput = false; // Only allow input to be active if the game isn't over
			break;
		case "none":
			overlay.style.display = "block";
			disableInput = true;
			break;
	}
} // Shows/hides the currently active screen (flips between display states)

function displayMessage(message) {
	let popup = document.createElement('div');
	popup.classList.add('popup');
	popup.innerHTML = message;

	popup.addEventListener('transitionend', () => { popup.remove() });
	setTimeout(() => { popup.classList.add('fade-out'); }, 1000);

	let messageContainer = document.querySelector('.message-container')
	messageContainer.insertBefore(popup, messageContainer.firstChild);
} // Displays a message for the user

// ------------------------------------------------------------------------
// ANIMATIONS
// ------------------------------------------------------------------------
function colorBox(box, color) {
	box.style.backgroundColor = color;
	box.style.borderColor = color;
} // Set the given letter box's color

function flipBox(colors, i, row) {
	let letterBox = letterDivs[(5*row)+i];
	letterBox.classList.remove('pop'); // Remove pop class so it doesn't interfere with animation

	// Create temporary functions so that we can remove them when the animation ends
	let tempOne = () => { 
		colorBox(letterBox, colors[i]);
	}
	let tempTwo = () => {
		letterBox.removeEventListener("animationiteration", tempOne);
		letterBox.removeEventListener("animationend", tempTwo);
		letterBox.classList.remove('flip');
		if (i < 4) {
			flipBox(colors, i+1, row); 
		} else {
			for (let j = 0; j < 5; j++) {
				colorKey(letterDivs[(5*row)+j].innerHTML, colors[j]);
			}
		} // Flip next letter box unless this is the last letter box or we are flipping the boxes quickly, after all boxes are filled, color keys
	};

	letterBox.addEventListener("animationiteration", tempOne); // After the letter box has completed one iteration of the animation (It's exactly flat), change its color
	letterBox.addEventListener("animationend", tempTwo);

	letterBox.classList.add('flip'); // Start animation
} // Animates letter box to flip over and reveal it's state

function quickFlip(colors, row, interval) {
	for (let i = 0; i < 5; i++) {
		setTimeout(function() {
			let letterBox = letterDivs[(5*row)+i];
			letterBox.classList.remove('pop'); // Remove pop class so it doesn't interfere with animation

			// Create temporary functions so that we can remove them when the animation ends
			let tempOne = () => {
				//console.log(letterBox, colors[i])
				colorBox(letterBox, colors[i]);
			}
			let tempTwo = () => {
				//console.log(letterBox)
				letterBox.removeEventListener("animationiteration", tempOne);
				letterBox.removeEventListener("animationend", tempTwo);
				letterBox.classList.remove('flip');
				if (i == 4) {
					for (let j = 0; j < 5; j++) {
						colorKey(letterDivs[(5*row)+j].innerHTML, colors[j]);
					}
				}
			};

			letterBox.addEventListener("animationiteration", tempOne); // After the letter box has completed one iteration of the animation (It's exactly flat), change its color
			letterBox.addEventListener("animationend", tempTwo);

			letterBox.classList.add('flip'); // Start animation
		}, interval*i);
	} // Flip letters with a gap equal to interval
} // Flips the boxes quickly when the page is refreshed

function changeSolution(index) {
	wordle = wordles[index]; // Pick a random word from list of wordles
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
		displayMessage("Not a valid word");
		return;
	} // If guess is not a valid word, shake letters and exit function
	
	// if (guess == wordle) {
	// 	activeScreen = 1;
	// 	disableInput = true;
	// 	flipBox(new Array(5).fill("var(--correct)"), 0, guessCount); // Color squares correct
	// 	setTimeout(showHideScreen, 3000); // Wait til all letters have flipped before showing end screen
	// 	return;
	// } // If the guess is the wordle, the player wins
	
	let boxColors = new Array(5); // Array that holds all the cells colors
	let tempWordle = wordle.split(''); // Temorary wordle that we can remove letters from so that we don't count letters more than once
	let correctIndicies = []; // List of correctly placed letter's indicies
	for (let i = 0; i < 5; i++) {
		if (wordle[i] == guess[i]) {
			boxColors[i] = "var(--correct)"; // Set square color to correct
			correctIndicies.push(i); // Add index to list of correct indicies
			tempWordle.splice(tempWordle.indexOf(wordle[i]), 1); // Remove letter from temporary wordle
			continue; // Skip current iteration
		} // If the two letters are in the same place
		
		// If the current letter is not in the wordle because we haven't skipped the current iteration
		boxColors[i] = "var(--absent)"; // Set square color to absent
	} // Check for correct and absent letters
	
	for (let i = 0; i < 5; i++) {
		if (tempWordle.includes(guess[i]) && !correctIndicies.includes(i)) {
			boxColors[i] = "var(--present)"; // Set square color to present
			tempWordle.splice(tempWordle.indexOf(guess[i]), 1); // Remove letter from temporary wordle
		} // If the current letter is in the wordle and the current index isn't a letter that is already correctly placed
	} // Check for present letters

	updateStorage(guess, boxColors); // Update local storage
	flipBox(boxColors, 0, guessCount); // Flip first box

	if (guessCount == 5 || guess == wordle) {
		console.log("s")
		activeScreen = 2;
		disableInput = true;
		setTimeout(showHideScreen, 3000); // Wait til all letters have flipped before showing end screen
		return;
	} // This was the player's last guess and they didn't win

	activeScreen = 1;
	localStorage.setItem('active-screen', '1');
	guessCount++; // Increase number of guesses made
	currentGuess = ""; // Clear current guess
}

function restartGame() {
	localStorage.clear();

	guessCount = 0;
	currentGuess = "";
	disableInput = false;
	activeScreen = 0;

	wordleIndex = Math.floor(Math.random() * wordles.length); // Pick a new random word from list of wordles
	wordle = wordles[wordleIndex];
	document.getElementById('wordle').innerHTML = `The word was: ${wordle.toUpperCase()}`;
	showHideScreen();

	initStorage();
	
	for (let i = 0; i < keyDivs.length; i++) {
		if (keyDivs[i].classList.contains("dark-key")) {
			keyDivs[i].classList.remove("dark-key");
			keyDivs[i].style.background = "hsl(0, 0%, 95%)";
		}
	} // Reset keyboard colors
	
	for (let i = 0; i < letterDivs.length; i++) {
		letterDivs[i].innerHTML = "";
		letterDivs[i].style.backgroundColor = "";
		letterDivs[i].style.borderColor = "var(--border-dark)";
	} // Clear letter boxes
}

function generateEmojis() {
	let emojis = [];
	for (let i = 0; i < letterDivs.length; i++) {
		if (letterDivs[i].innerHTML == "") break; // If there isn't a letter, exit for loop
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
	try {
		await navigator.share({
			title: 'Sharedle',
			text: `Sharedle ${wordleIndex} ${guessCount+1}/6\nTry it yourself!\n${emojis}`,
			url: `https://carterbryantt.github.io/Sharedle/?index=${wordleIndex}`,
			url: `https://carterbryantt.github.io/Sharedle/`
		});
	} catch(err) {
		console.log(err);
	}
}

// ------------------------------------------------------------------------
// LOCAL STORAGE
// ------------------------------------------------------------------------
function initStorage() {
	localStorage.setItem('guessed-words', JSON.stringify(new Array(6).fill(""))); // List of guessed words
	localStorage.setItem('word-states', JSON.stringify(new Array(6).fill(""))); // List of letter states for each word
	localStorage.setItem('current-row', "0"); // Number indicating the row the player is currently on
	localStorage.setItem('solution-index', wordleIndex); // Index of the sharedle the player has to guess
	localStorage.setItem('active-screen', "0"); // Index of the sharedle the player has to guess
	console.log(localStorage, wordleIndex)
}

function updateStorage(guess, states) {
	let guessedWords = JSON.parse(localStorage.getItem('guessed-words'));
	let wordStates = JSON.parse(localStorage.getItem('word-states'));

	guessedWords[guessCount] = guess;
	wordStates[guessCount] = states;
	
	localStorage.setItem('guessed-words', JSON.stringify(guessedWords));
	localStorage.setItem('word-states', JSON.stringify(wordStates));
	localStorage.setItem('current-row', JSON.stringify(guessCount+1));
}

function fillInGuesses() {
	let hasIndexChanged = urlIndex !== null && urlIndex != JSON.parse(localStorage.getItem('solution-index'));

	if (localStorage.getItem('guessed-words') === null || hasIndexChanged) {
		initStorage();
		return;
	} // If starting values aren't defined or the game index has changed, initialize them and exit function
	
	// -----------------------------------------
	// EXECUTES ONLY IF GAME IS ALREADY GOING ON
	// -----------------------------------------
	guessCount = JSON.parse(localStorage.getItem('current-row'));

	changeSolution(JSON.parse(localStorage.getItem('solution-index')));

	let guessedWords = JSON.parse(localStorage.getItem('guessed-words'));
	let wordStates = JSON.parse(localStorage.getItem('word-states'));
	for (let i = 0; i < guessCount; i++) {
		updateWord(guessedWords[i].toUpperCase(), i);
		quickFlip(wordStates[i], i, 200);
	}
}