import {byDate as wordles, valid as validWords, all as allWords, futureWords, all} from "./word-lists.js"; // Import all word lists from word list file

// ------------------------------------------------------------------------
// INPUT
// ------------------------------------------------------------------------
let currentGuess,
	lastLength;

let letterDivs, keyDivs;

let defaultGameWidth,
	defaultGameHeight,
	boardRatio;

let storage = {
	get currentRow() { return JSON.parse(localStorage.getItem('current-row')); },
	get urlParams() { return new URLSearchParams(localStorage.getItem('url-params')); },
	get solutionIndex() { return JSON.parse(localStorage.getItem('solution-index')); },
	get solution() { return localStorage.getItem('solution'); },
	get activeScreen() { return JSON.parse(localStorage.getItem('active-screen')); },
	get isInputDisabled() { return JSON.parse(localStorage.getItem('is-input-disabled')); }
}

function setup() {
	{
		currentGuess = ""; // String to keep track of the current word being input
		lastLength = 0; // Last currentWord length; variable used in `update` function

		defaultGameWidth = document.querySelector(".input-letters").offsetWidth; // Get initial starting height
		defaultGameHeight = document.querySelector(".input-letters").offsetHeight; // Get initial starting height
		boardRatio = defaultGameWidth/defaultGameHeight;
	} // Set up variables 

	{
		document.querySelectorAll('.close-button').forEach(e => e.addEventListener('click', () => showHideScreen(storage.activeScreen))); // Get close screen buttons and add click event
		document.getElementById('menu-button').addEventListener('click', () => showHideScreen(storage.activeScreen)); // Get close screen buttons and add click event
		document.getElementById('contact-button').addEventListener('click', () => showHideScreen(3)); // Show contact screen when contact button is pressed
		document.getElementById('stats-button').addEventListener('click', () => showHideScreen(4)); // Show contact screen when contact button is pressed
		document.getElementById('info-button').addEventListener('click', () => showHideScreen(0)); // Show info screen when info button is pressed

		letterDivs = document.querySelectorAll('.letter-box'); // Get letter boxes
		keyDivs = document.querySelectorAll('.key'); // Get all keyboard keys
		for (let i = 0; i < keyDivs.length; i++) {
			keyDivs[i].addEventListener('click', keyPress);
		} // Add event listener to all key divs to listen for mouse clicks

		document.querySelectorAll('.restart-button').forEach(e => e.addEventListener('click', restartGame)); // Reset game when the restart button is clicked
		document.getElementById('share-button').addEventListener('click', share); // Bring up share screen to share emojis
		document.addEventListener('keydown', keyPress); // Add event listener to the document to listen for keypresses
	} // Add event listeners to divs

	resizeGame();
	fillInGuesses(); // Using the local storage, if the player is already playing a game, fill that game data in
	showHideScreen(storage.activeScreen);
	document.getElementById('wordle').innerHTML = `<b>The word was: ${storage.solution.toUpperCase()}</b>`;
} // Get game setup
window.onload = setup();

function keyPress(e) {
	if (storage.isInputDisabled || document.activeElement == document.getElementById('password')) return; // If input is disabled because the end screen is displayed or if the password is being entered, exit function
	
	if (e.type == "click") {
		let keyDiv = e.target; // Get div clicked

		if (keyDiv.classList.contains('misc-key')) {
			if (keyDiv.id == "backspace" && currentGuess.length != 0) currentGuess = currentGuess.slice(0, -1); // Check if the key pressed is the backspace key, if it is, remove the last letter from the word. Also make sure there is at least 1 letter in the current guess

			if (keyDiv.innerHTML == "ENTER" && currentGuess.length == 5) guessWord(currentGuess.toLowerCase()); // Check if the key pressed is the enter key, if it is, run the search algorithm on the word. Also check if the current guess is at least 5 letters long
			updateWord(currentGuess, storage.currentRow); // Display new word
			return;
		} // Check if key pressed is a miscellaneous key or if it is the backspace icon, if it is don't add text to input word

		if (currentGuess.length != 5) currentGuess += keyDiv.innerHTML; // If current guess is not already five letters long and the div key pressed is a letter, add the letter to the current guess

		updateWord(currentGuess, storage.currentRow); // Display new word
	} // If the event that triggered the function is a click event
	if (e.type == "keydown") {
		let key = e.code; // Get key pressed
		
		if (key.slice(0,3) != "Key" && key != "Enter" && key != "Backspace") return; // If key pressed is not a letter key, enter, or backspace, exit function

		if (key == "Backspace" && currentGuess.length != 0) currentGuess = currentGuess.slice(0, -1); // If there is at least one letter, delete the last letter in the current guess
		
		if (!e.repeat && key == "Enter" && currentGuess.length == 5) guessWord(currentGuess.toLowerCase()); // If the key is not being held down there are at least five letters, enter word

		if (currentGuess.length != 5 && key != "Enter" && key != "Backspace") currentGuess += key.slice(3); // If the key pressed is not enter or backspace, remove "Key" from the string so that you are just left with the letter (KeyA - Key = A) and add it to the current guess

		if (storage.currentRow != 6) updateWord(currentGuess, storage.currentRow); // Display new word
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

function showHideScreen(screen) {
	let screens = document.querySelectorAll('.screen');
	for (let i = 0; i < screens.length; i++) {
		if (i == screen) { screens[i].style.display = "flex"; continue; }
		screens[i].style.display = "none";
	}

	let overlay = document.querySelector('.overlay');
	switch(window.getComputedStyle(overlay).display) {
		case "flex":
			overlay.style.display = "none";
			if (storage.activeScreen != 2) localStorage.setItem('is-input-disabled', false); // Only allow input to be active if the game isn't over
			break;
		case "none":
			overlay.style.display = "flex";
			localStorage.setItem('is-input-disabled', true);
			break;
	}
} // Shows/hides the currently active screen (flips between display states)

function displayMessage(message, time) {
	let popup = document.createElement('div');
	popup.classList.add('popup');
	popup.innerHTML = message;

	popup.addEventListener('transitionend', () => { popup.remove() });
	setTimeout(() => { popup.classList.add('fade-out'); }, time);

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

function flipBox(colors, i, row, gameOver) {
	let letterBox = letterDivs[(5*row)+i];
	letterBox.classList.remove('pop'); // Remove pop class so it doesn't interfere with animation

	// Create temporary functions so that we can remove them when the animation ends
	let color = () => { 
		colorBox(letterBox, colors[i]);
	}
	let animEnd = () => {
		letterBox.removeEventListener("animationiteration", color);
		letterBox.removeEventListener("animationend", animEnd);
		letterBox.classList.remove('flip');
		if (i < 4) {
			flipBox(colors, i+1, row, gameOver); 
		} else {
			for (let j = 0; j < 5; j++) {
				colorKey(letterDivs[(5*row)+j].innerHTML, colors[j]);
			}
			if (gameOver) bounceBoxes(row, 200);
		} // Flip next letter box unless this is the last letter box or we are flipping the boxes quickly, after all boxes are filled, color keys
	};

	letterBox.addEventListener("animationiteration", color); // After the letter box has completed one iteration of the animation (It's exactly flat), change its color
	letterBox.addEventListener("animationend", animEnd);

	letterBox.classList.add('flip'); // Start animation
} // Animates letter box to flip over and reveal it's state

function quickFlip(colors, row, interval) {
	for (let i = 0; i < 5; i++) {
		setTimeout(function() {
			let letterBox = letterDivs[(5*row)+i];
			letterBox.classList.remove('pop'); // Remove pop class so it doesn't interfere with animation

			// Create temporary functions so that we can remove them when the animation ends
			let color = () => {
				colorBox(letterBox, colors[i]);
			}
			let animEnd = () => {
				letterBox.removeEventListener("animationiteration", color);
				letterBox.removeEventListener("animationend", animEnd);
				letterBox.classList.remove('flip');
				if (i == 4) {
					for (let j = 0; j < 5; j++) {
						colorKey(letterDivs[(5*row)+j].innerHTML, colors[j]);
					}
				}
			};

			letterBox.addEventListener("animationiteration", color); // After the letter box has completed one iteration of the animation (It's exactly flat), change its color
			letterBox.addEventListener("animationend", animEnd);

			letterBox.classList.add('flip'); // Start animation
		}, interval*i);
	} // Flip letters with a gap equal to interval
} // Flips the boxes quickly when the page is refreshed

function bounceBoxes(row, interval) {
	for (let i = 0; i < 5; i++) {
		setTimeout(function() {
			let letterBox = letterDivs[(5*row)+i];

			let animEnd = () => {
				letterBox.removeEventListener("animationend", animEnd);
				letterBox.classList.remove('bounce');
			}

			letterBox.addEventListener("animationend", animEnd);
			letterBox.classList.add('bounce');
		}, interval*i);
	} // Bounce boxes with a gap equal to interval
} // Bounce letters when the player wins

// ------------------------------------------------------------------------
// ALGORITHM
// ------------------------------------------------------------------------
function guessWord(guess) {
	if (!allWords.includes(guess)) {
		for (let i = 0; i < 5; i++) {
			let flip = letterDivs[(5*storage.currentRow)+i].classList.contains("shake-0") ? 1 : 0; // Get animation number, so we can flip to the other one
			letterDivs[(5*storage.currentRow)+i].classList.remove(`shake-${1^flip}`);
			letterDivs[(5*storage.currentRow)+i].classList.add(`shake-${flip}`);
		}
		displayMessage("Not a valid word", 1000);
		return;
	} // If guess is not a valid word, shake letters and exit function
	
	let boxColors = new Array(5); // Array that holds all the cells colors
	let tempWordle = storage.solution.split(''); // Temorary wordle that we can remove letters from so that we don't count letters more than once
	let correctIndicies = []; // List of correctly placed letter's indicies
	for (let i = 0; i < 5; i++) {
		if (storage.solution[i] == guess[i]) {
			boxColors[i] = "var(--correct)"; // Set square color to correct
			correctIndicies.push(i); // Add index to list of correct indicies
			tempWordle.splice(tempWordle.indexOf(storage.solution[i]), 1); // Remove letter from temporary wordle
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
	flipBox(boxColors, 0, storage.currentRow, guess == storage.solution); // Flip first box

	if (storage.currentRow == 5 || guess == storage.solution) {
		localStorage.setItem('active-screen', '2');
		localStorage.setItem('is-input-disabled', true);

		let winMessage;
		switch(storage.currentRow) {
			case 0:
				winMessage = "Incredible!";
				break;
			case 1:
				winMessage = "Great!";
				break;
			case 2:
				winMessage = "Solid!";
				break;
			case 3:
				winMessage = "Nice Job!";
				break;
			case 4:
				winMessage = "Cool!";
				break;
			case 5:
				winMessage = guess == storage.solution ? "Close One!" : "Better Luck Next Time!";
				break;
		}

		setTimeout(() => displayMessage(winMessage, 3000), 2500);
		setTimeout(() => showHideScreen(storage.activeScreen), 5000); // Wait til all letters have flipped before showing end screen
		return;
	} // If the player doesn't win or they guess the word

	localStorage.setItem('active-screen', '1');
	localStorage.setItem('current-row', storage.currentRow+1);
	currentGuess = ""; // Clear current guess
}

function restartGame() {
	localStorage.clear();

	currentGuess = "";
	
	localStorage.setItem('url-params', new URLSearchParams(storage.urlParams).detele('index'));
	initStorage();
	showHideScreen(storage.activeScreen);

	document.getElementById('wordle').innerHTML = `The word was: ${storage.solution.toUpperCase()}`;

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
	return emojis.slice(0, -1); // Remove last newline (\n) from string
}

async function share() {
	let emojis = generateEmojis();
	console.log(`Sharedle ${storage.solutionIndex} ${JSON.parse(localStorage.getItem('guessed-words'))[5] != storage.solution && storage.currentRow == 5 ? "X" : storage.currentRow+1}/6\nTry it yourself!\n${emojis}\nSolve the same word: https://carterbryantt.github.io/Sharedle/?index=${storage.solutionIndex}\nSolve your own: https://carterbryantt.github.io/Sharedle/`)
	try {
		await navigator.share({
			title: 'Sharedle',
			text: `Sharedle ${storage.solutionIndex} ${JSON.parse(localStorage.getItem('guessed-words'))[5] != storage.solution && storage.currentRow == 5 ? "X" : storage.currentRow+1}/6\nTry it yourself!\n${emojis}\nSolve the same word: https://carterbryantt.github.io/Sharedle/?index=${storage.solutionIndex}\nSolve your own: https://carterbryantt.github.io/Sharedle/`
		});
	} catch(err) {
		displayMessage("Sorry, an error occured when trying to share.\nPlease check your device settings or try again later.", 2000);
		console.log(err);
	}
}

// ------------------------------------------------------------------------
// LOCAL STORAGE
// ------------------------------------------------------------------------
function initStorage() {
	localStorage.setItem('guessed-words', JSON.stringify(new Array(6).fill(""))); // List of guessed words
	localStorage.setItem('word-states', JSON.stringify(new Array(6).fill(""))); // List of letter states for each word
	localStorage.setItem('current-row', '0'); // Number indicating the row the player is currently on
	console.log(`URL Params: ${storage.urlParams} Value doesn't exist: ${storage.urlParams === null}, Index the same as the last: ${new URLSearchParams(window.location.search).get('index') === storage.urlParams.get('index')}`)
	localStorage.setItem('url-params', storage.urlParams === null ? new URLSearchParams(window.location.search) : storage.urlParams); // Creates object which holds url parameters
	localStorage.setItem('solution-index', JSON.parse(storage.urlParams.get('index')) || Math.floor(Math.random() * wordles.length)); // Index of the sharedle the player has to guess
	localStorage.setItem('solution', wordles[storage.solutionIndex]); // Index of the sharedle the player has to guess
	localStorage.setItem('active-screen', '0'); // Index of the sharedle the player has to guess
	localStorage.setItem('is-input-disabled', false); // Boolean value that won't allow the user to type letters if true
	console.log(localStorage)
}

function updateStorage(guess, states) {
	let guessedWords = JSON.parse(localStorage.getItem('guessed-words'));
	let wordStates = JSON.parse(localStorage.getItem('word-states'));

	guessedWords[storage.currentRow] = guess;
	wordStates[storage.currentRow] = states;
	
	localStorage.setItem('guessed-words', JSON.stringify(guessedWords));
	localStorage.setItem('word-states', JSON.stringify(wordStates));
}

function fillInGuesses() {
	let storageVariables = ['guessed-words', 'word-states', 'current-row', 'url-params', 'solution-index', 'solution', 'active-screen', 'is-input-disabled'];
	for (let i = 0; i < storageVariables.length; i++) {
		if (localStorage.getItem(storageVariables[i]) === null) { initStorage(); return; }
	} // If starting values aren't defined, initialize them and exit function

	let urlIndex = new URLSearchParams(window.location.search).get('index');
	if (urlIndex != storage.urlParams.get('index')) { initStorage(); return; } // If the game index has changed, initialize the starting values and exit function
	// -----------------------------------------
	// EXECUTES ONLY IF GAME IS ALREADY GOING ON
	// -----------------------------------------
	let guessedWords = JSON.parse(localStorage.getItem('guessed-words'));
	let wordStates = JSON.parse(localStorage.getItem('word-states'));
	for (let i = 0; i < guessedWords.length; i++) {
		updateWord(guessedWords[i].toUpperCase(), i);
		quickFlip(wordStates[i], i, 200);
	}
}

// ------------------------------------------------------------------------
// RESIZE GAME
// ------------------------------------------------------------------------
window.onresize = resizeGame;

function resizeGame() {
	let inputLetters = document.querySelector(".input-letters");

	document.querySelector(".container").style.height = `${window.innerHeight}px`;

	let windowOffset = 768 - window.innerHeight; // 784 is the total height of the header, game, and keyboard
	if (windowOffset > 0) {
		inputLetters.style.width = `${defaultGameWidth - (windowOffset*boardRatio)}px`;
		inputLetters.style.height = `${defaultGameHeight - windowOffset}px`;
	} // If the window got smaller
	if (windowOffset <= 0) {
		inputLetters.style.width = `${defaultGameWidth}px`;
		inputLetters.style.height = `${defaultGameHeight}px`;
	} // If the window is able to fit the game
}