const scene = document.getElementById("scene");
const dialogueText = document.getElementById("dialogue-text");
const choices = document.getElementById("choices");
let autoAdvanceStoryTimeout;

let storyVariables = {};

// Track characters that have already entered to prevent re-triggering entry animations
const enteredCharacters = new Set();

// Update the displayCharacters function to handle proper positioning and animated entry
function displayCharacters(characters) {
  const existingCharacters = Array.from(scene.querySelectorAll(".character"));

  // Remove characters with "position: exit"
  existingCharacters.forEach((charElement) => {
    const charName = charElement.getAttribute("alt");
    const exitingCharacter = characters.find(
      (char) => char.name === charName && char.position === "exit",
    );

    if (exitingCharacter) {
      logDebug("Handling character exit", exitingCharacter.name);
      charElement.style.transition = "transform 0.5s ease, opacity 0.5s ease";
      charElement.style.transform =
        charElement.style.left === "10%" // Check if the character is on the left
          ? "translateX(-100%)" // Slide left for characters on the left
          : "translateX(100%)"; // Slide right for characters on the right
      charElement.style.opacity = "0";
      setTimeout(() => {
        charElement.remove();
        enteredCharacters.delete(charName); // Remove from enteredCharacters
      }, 500);
    }
  });

  // Add or update characters dynamically
  const remainingCharacters = characters.filter(
    (char) => char.position !== "exit",
  );

  remainingCharacters.forEach((character) => {
    let charElement = scene.querySelector(
      `.character[alt='${character.name}']`,
    );

    if (!charElement) {
      charElement = document.createElement("img");
      charElement.src = character.image;
      charElement.alt = character.name;
      charElement.classList.add("character");
      charElement.style.position = "absolute";
      charElement.style.opacity = "0"; // Start invisible for animation
      scene.appendChild(charElement);
    }

    if (!enteredCharacters.has(character.name)) {
      // Animate entry based on position
      if (character.position === "left") {
        logDebug(
          `Animating character '${character.name}' entering from the left.`,
        );
        charElement.style.left = "10%"; // Left rule of thirds
        //charElement.style.bottom = "10%";
        charElement.style.transform = "translateX(-100%)"; // Start off-screen left
        setTimeout(() => {
          charElement.style.transition =
            "transform 0.5s ease, opacity 0.5s ease";
          charElement.style.transform = "translateX(0)"; // Slide into position
          charElement.style.opacity = "1"; // Fade in
        }, 10);
      } else if (character.position === "right") {
        logDebug(
          `Animating character '${character.name}' entering from the right.`,
        );
        charElement.style.left = "70%"; // Right rule of thirds
        //charElement.style.bottom = "10%";
        charElement.style.transform = "translateX(100%)"; // Start off-screen right
        setTimeout(() => {
          charElement.style.transition =
            "transform 0.5s ease, opacity 0.5s ease";
          charElement.style.transform = "translateX(0)"; // Slide into position
          charElement.style.opacity = "1"; // Fade in
        }, 10);
      } else {
        logDebug(
          `Centering character '${character.name}' as the last remaining.`,
        );
        charElement.style.left = "50%"; // Center the last character
        //charElement.style.bottom = "10%";
        charElement.style.transform = "translateX(-50%)"; // Adjust for centering
        charElement.style.transition = "transform 0.5s ease, opacity 0.5s ease";
        charElement.style.opacity = "1"; // Ensure visibility
      }
      enteredCharacters.add(character.name); // Mark character as entered
    } else {
      // Update position for characters already in the scene with animation
      logDebug(
        `Updating position for character '${character.name}' already in the scene.`,
      );
      charElement.style.transition = "left 0.5s ease, transform 0.5s ease";
      if (character.position === "left") {
        charElement.style.left = "10%"; // Move to left rule of thirds
        charElement.style.transform = "translateX(0)"; // Ensure no offset
      } else if (character.position === "right") {
        charElement.style.left = "70%"; // Move to right rule of thirds
        charElement.style.transform = "translateX(0)"; // Ensure no offset
      } else {
        charElement.style.left = "50%"; // Center the character
        charElement.style.transform = "translateX(-50%)"; // Adjust for centering
      }
    }
  });
}

// Update the displayDialogue function to access defaultColors correctly
function displayDialogue(text, character) {
  const dialogueContainer = dialogueText.parentElement; // Assuming the container wraps the dialogueText
  const defaultColors = storyVariables.constants?.defaultColors; // Access defaultColors correctly
  logDebug("Current storyVariables.constants.defaultColors", defaultColors); // Debug the defaultColors object
  logDebug("Current character for dialogue", character); // Debug the character value

  if (character && defaultColors && defaultColors[character]) {
    const color = defaultColors[character];
    logDebug(`Applying color override for ${character}: ${color}`); // Debug statement for color override
    dialogueContainer.style.borderColor = color;
  } else {
    dialogueContainer.style.borderColor = ""; // Reset to default if no color is found
  }
  dialogueText.textContent = text;

  // Auto-advance dialogue if autoplay is enabled in localStorage
  let autoAdvanceTimeout;
  if (localStorage.getItem("autoplay") === "true") {
    autoAdvanceTimeout = setTimeout(() => {
      const event = new Event("click");
      dialogueText.dispatchEvent(event);
    }, 3000); // Adjust the delay as needed (e.g., 3000ms for 3 seconds)
  }

  // Clear the auto-advance timeout if the user clicks manually
  document.addEventListener(
    "click",
    () => {
      if (autoAdvanceTimeout) {
        clearTimeout(autoAdvanceTimeout);
        autoAdvanceTimeout = null;
      }
    },
    { once: true },
  );
}

function displayCharacterName(character, position) {
  let nameTagWrapper = document.getElementById("character-name-wrapper");

  if (!nameTagWrapper) {
    nameTagWrapper = document.createElement("div");
    nameTagWrapper.id = "character-name-wrapper";
    nameTagWrapper.style.position = "absolute";
    nameTagWrapper.style.left = "50%";
    nameTagWrapper.style.transform = "translateX(-50%)";
    document.body.appendChild(nameTagWrapper);
  }

  let nameTag = document.getElementById("character-name-tag");

  if (!nameTag) {
    nameTag = document.createElement("div");
    nameTag.id = "character-name-tag";
    nameTagWrapper.appendChild(nameTag);
  }

  if (character) {
    nameTag.textContent = character;
    nameTag.style.display = "block";

    if (position === "left") {
      nameTag.style.transform = "translateX(-30vmin)";
    } else if (position === "right") {
      nameTag.style.transform = "translateX(30vmin)";
    } else {
      nameTag.style.transform = "translateX(-30vmin)";
    }

    const defaultColors = storyVariables.constants?.defaultColors; // Access defaultColors correctly

    if (defaultColors && defaultColors[character]) {
      const color = defaultColors[character];
      logDebug(`Applying color override for ${character}: ${color}`); // Debug statement for color override
      nameTag.style.borderColor = color;
    } else {
      nameTag.style.borderColor = ""; // Reset to default if no color is found
    }
  } else {
    nameTag.style.display = "none"; // Hide if no character
  }
}

function displayChoices(options, processEntry, currentIndexRef) {
  choices.innerHTML = "";
  options.forEach((option, index) => {
    const button = document.createElement("button");
    button.textContent = option.text;
    button.classList.add("choice");
    button.style.backgroundImage = `linear-gradient(60deg, #fff, #fff, ${dialogueText.parentElement.style.borderColor})`; // Match gradient to dialogue box border
    button.addEventListener("click", () => {
      button.disabled = true; // Disable the button immediately to prevent further clicks
      setTimeout(() => {
        if (option.effects) {
          applyEffects(option.effects);
        }
        if (option.toast) {
          showToast(option.toast, option.effects);
        }
        choices.innerHTML = ""; // Remove choice buttons from the DOM
        currentIndexRef.current++; // Progress the story
        processEntry();
      }, 100); // Add a 100ms delay before continuing
    });
    choices.appendChild(button);

    // Apply the 'show' class with a staggered delay
    setTimeout(() => {
      button.classList.add("show");
    }, index * 100); // 0.1 second delay between each choice
  });
}

function applyEffects(effects) {
  Object.keys(effects).forEach((key) => {
    if (key === "affection") {
      Object.keys(effects.affection).forEach((character) => {
        storyVariables.affection[character] =
          (storyVariables.affection[character] || 0) +
          effects.affection[character];
        localStorage.setItem(
          "affectionLevels",
          JSON.stringify(storyVariables.affection),
        );
      });
    } else {
      storyVariables[key] = effects[key];
    }
  });
}

function showToast(toast, effects) {
  let affectedCharacters = [];
  if (effects && effects.affection) {
    affectedCharacters = Object.keys(effects.affection);
  }

  let charReplacement = "They";
  if (affectedCharacters.length === 1) {
    charReplacement = affectedCharacters[0];
  } else if (affectedCharacters.length === 2) {
    charReplacement = `${affectedCharacters[0]} and ${affectedCharacters[1]}`;
  }

  const toastMessage = toast.replace("{{char}}", charReplacement);
  const toastElement = document.createElement("div");
  toastElement.classList.add("toast");
  toastElement.textContent = toastMessage;
  document.body.appendChild(toastElement);

  // Trigger animation
  setTimeout(() => {
    toastElement.classList.add("show");
  }, 10);

  // Remove toast after 3.5 seconds
  setTimeout(() => {
    toastElement.classList.remove("show");
    setTimeout(() => toastElement.remove(), 500);
  }, 3000);
}

function getUrlParams() {
  const params = new URLSearchParams(window.location.search);
  return Object.fromEntries(params.entries());
}

const debugMode = getUrlParams().debug === "1";

function logDebug(message, data) {
  if (debugMode) {
    console.log(`[DEBUG] ${message}`, data);
  }
}

function parseMetadataAndConstants(json) {
  const { metadata, constants } = json;

  // Update metadata
  if (metadata) {
    document.title = `${metadata.storyName} - Tokimeki`;
    logDebug("Metadata loaded", metadata);
  }

  // Update constants
  if (constants) {
    Object.assign(storyVariables, constants);
    logDebug("Constants loaded", constants);
  }
}

function parseStory(json) {
  console.log("Parsing story JSON", json); // Debug log for story parsing
  const storyStack = [{ story: json.story || json, progress: [] }]; // Stack to manage story contexts with progress tracking

  function peekNextEntry() {
    if (storyStack.length === 0) {
      console.log("No more content to peek at.");
      return { stackLength: 0, nextCharacter: null, nextDialogue: null }; // Return empty state if the stack is empty
    }

    const simulateStack = [...storyStack]; // Clone the story stack to simulate changes

    while (simulateStack.length > 0) {
      const currentContext = simulateStack[simulateStack.length - 1];
      const { story, progress } = currentContext;

      // Find the next unprocessed entry
      const nextEntry = story.find((entry) => !progress.includes(entry));

      if (nextEntry) {
        // Return the next character, dialogue, and simulated stack length
        return {
          stackLength: simulateStack.length,
          nextCharacter: nextEntry.character || null,
          nextDialogue: nextEntry.dialogue || null,
        };
      }

      // Simulate popping the stack if no next entry in the current context
      simulateStack.pop();
    }

    // If the stack is empty after simulation, return empty state
    return { stackLength: 0, nextCharacter: null, nextDialogue: null };
  }

  function processEntry(autoTrigger = false) {
    if (storyStack.length === 0) {
      console.log("Story Ended: No more content to process.");
      endStory();
      return;
    }

    const currentContext = storyStack[storyStack.length - 1];
    const { story, progress } = currentContext;

    // Find the next unprocessed entry
    const nextEntry = story.find((entry) => !progress.includes(entry));

    if (!nextEntry) {
      storyStack.pop(); // Exit the current story context
      processEntry(); // Continue with the previous context
      return;
    }

    progress.push(nextEntry); // Mark the entry as processed
    logDebug("Processing story entry", nextEntry);

    const {
      background, // Add background to the destructured properties
      character,
      state,
      outfit,
      position,
      sfx,
      vfx,
      dialogue,
      responses,
      branch,
      unlocks,
    } = nextEntry;

    if (unlocks) {
      logDebug("Saving unlocks", unlocks);
      saveUnlocks(unlocks);
    }

    if (background) {
      logDebug("Changing background", background);
      displayBackground(background);
    }

    // Handle branch objects
    if (branch) {
      const { condition, story: branchStory } = branch;
      logDebug("Evaluating branch condition", condition);
      if (evaluateCondition(condition)) {
        logDebug("Branch condition met, processing branch story", branchStory);
        storyStack.push({ story: branchStory, progress: [] }); // Push the branch story onto the stack
        processEntry();
      } else {
        logDebug("Branch condition not met, skipping branch.", condition);
        processEntry(); // Continue with the current story
      }
      return; // Wait for user input
    }

    // Handle character entry without dialogue
    if (character && !dialogue && !responses && !branch) {
      const characterData = {
        name: character,
        image: `assets/characters/${character}/${outfit || "default"}/${state || "neutral"}.png`,
        position: position, // Ensure position is included
      };
      if (position === "left" || position === "right") {
        characterData.enterFrom = position;
      }
      logDebug("Displaying character entry", characterData);
      displayCharacters([characterData]);

      // Skip user interaction and proceed immediately
      processEntry();
      return;
    }

    // Handle character exit
    if (character && position === "exit") {
      const exitingCharacter = document.querySelector(
        `.character[alt='${character}']`,
      );
      if (exitingCharacter) {
        logDebug("Handling character exit", character);
        exitingCharacter.style.transition =
          "transform 0.5s ease, opacity 0.5s ease";
        exitingCharacter.style.transform =
          character === "left" ? "translateX(-100%)" : "translateX(100%)";
        exitingCharacter.style.opacity = "0";
        setTimeout(() => exitingCharacter.remove(), 500);
      }

      // Skip user interaction and proceed immediately
      processEntry();
      return;
    }

    // Handle character display
    if (character) {
      const characterData = {
        name: character,
        image: `assets/characters/${character}/${outfit || "default"}/${state || "neutral"}.png`,
        position: position, // Ensure position is included
      };
      logDebug("Displaying character", characterData);
      displayCharacters([characterData]);
    }

    // Handle dialogue
    if (dialogue) {
      logDebug("Displaying dialogue", dialogue);

      displayDialogue(dialogue, character); // Pass character to displayDialogue
      displayCharacterName(character, position); // Display the character name

      // Auto-advance dialogue if autoplay is enabled in localStorage
      if (
        localStorage.getItem("autoplay") === "true" &&
        peekNextEntry().stackLength > 0
      ) {
        logDebug("Autoplay is enabled, setting up auto-advance for dialogue.", {
          dialogue,
        });
        autoAdvanceStoryTimeout = setTimeout(
          () => {
            const event = new Event("click");
            document.dispatchEvent(event);
          },
          dialogue.length > 10 ? dialogue.length * 85 : 1000,
        );
      }

      // Clear the auto-advance timeout if the user clicks manually
      document.addEventListener(
        "click",
        () => {
          if (autoAdvanceStoryTimeout) {
            clearTimeout(autoAdvanceStoryTimeout);
            autoAdvanceStoryTimeout = null;
          }
        },
        { once: true },
      );

      if (autoTrigger) {
        // Automatically proceed for the first event
        setTimeout(() => processEntry(), 100);
        return;
      }

      // Ensure we wait for user interaction before progressing
      const waitForClick = () => {
        document.removeEventListener("click", waitForClick);
        processEntry();
      };

      document.addEventListener("click", waitForClick);
      return; // Wait for user input
    }

    // Handle SFX
    if (sfx) {
      logDebug("Playing SFX", sfx);
      const audio = new Audio(`sfx/${sfx}`);
      audio.play();
    }

    // Handle VFX
    if (vfx) {
      logDebug("Displaying VFX", vfx);
      const overlay = document.createElement("div");
      overlay.classList.add("vfx-overlay", vfx);
      document.body.appendChild(overlay);
      setTimeout(() => overlay.remove(), 2000);
    }

    // Handle responses
    if (responses) {
      logDebug("Displaying responses", responses);
      displayChoices(responses, processEntry, { current: 0 });
      return; // Wait for user to select a response
    }

    // Automatically proceed for the first event if autoTrigger is true
    if (autoTrigger) {
      processEntry();
      return;
    }

    // Wait for user interaction before progressing
    const waitForClick = () => {
      document.removeEventListener("click", waitForClick);
      processEntry();
    };
    document.addEventListener("click", waitForClick);
  }

  processEntry(true); // Trigger the first event automatically
}

function evaluateCondition(condition) {
  try {
    logDebug("Evaluating condition", {
      condition,
      variables: storyVariables,
    });
    const result = Function(
      "variables",
      `with (variables) { return ${condition}; }`,
    )(storyVariables);
    logDebug("Condition evaluation result", { condition, result });
    return result;
  } catch (error) {
    console.error("Error evaluating condition:", condition, error);
    return false;
  }
}

// Initialize story variables
storyVariables.affection =
  JSON.parse(localStorage.getItem("affectionLevels")) || {};

// Fetch and parse the story JSON
function playStory(jsonFilename) {
  const gameContainer = document.getElementById("game-container");
  const phoneContainer = document.getElementById("phone-container");
  const backgroundContainer = document.getElementById("background-container");

  if (gameContainer) {
    gameContainer.style.display = "flex"; // Set display to flex immediately
    setTimeout(() => {
      gameContainer.style.transition = "opacity 0.5s ease";
      gameContainer.style.opacity = "1"; // Fade in after a small delay
    }, 10); // Small delay to ensure transition
  }

  if (phoneContainer) {
    phoneContainer.style.opacity = "0";
    setTimeout(() => {
      phoneContainer.style.display = "none";
    }, 500);
  }

  if (!jsonFilename || typeof jsonFilename !== "string") {
    console.error("Invalid JSON filename provided to playStory.");
    return;
  }

  fetch(`scripts/events/${jsonFilename}`)
    // REPLACE WITH PATH TO PHP API AFTER TESTING
    .then((response) => response.json())
    .then((json) => {
      logDebug("Fetched story JSON", json); // Debug log for fetched JSON
      parseMetadataAndConstants(json);

      // Fetch predefined constants dynamically from story.json
      if (
        json.constants &&
        json.constants.paths &&
        json.constants.paths.predefinedConstants
      ) {
        fetch(json.constants.paths.predefinedConstants)
          .then((response) => response.json())
          .then((predefinedConstants) => {
            logDebug("Fetched predefined constants", predefinedConstants); // Debug log for predefined constants
            Object.assign(storyVariables, predefinedConstants); // Merge constants into storyVariables
            logDebug(
              "Updated storyVariables after merging predefined constants",
              storyVariables,
            ); // Verify the merge
            parseStory(json.story);
          })
          .catch((error) =>
            logDebug("Error loading predefined constants", error),
          );
      } else {
        parseStory(json.story);
      }
    })
    .catch((error) => logDebug("Error loading story JSON", error));
}

// Function to handle background rendering with fade-out, fade-in, and loading behavior
function displayBackground(background) {
  const backgroundContainer =
    document.getElementById("background-container") ||
    (() => {
      const container = document.createElement("div");
      container.id = "background-container";
      document.body.appendChild(container);
      return container;
    })();

  const currentBackground = backgroundContainer.querySelector(
    ".current-background",
  );
  const newBackground = document.createElement("img");
  newBackground.src = `assets/backgrounds/${background}`;
  newBackground.classList.add("new-background");
  newBackground.style.opacity = "0"; // Start with opacity 0 for fade-in effect
  newBackground.style.transition = "opacity 0.5s ease"; // Add transition for fade-in
  backgroundContainer.appendChild(newBackground);

  if (currentBackground) {
    // Fade out the current background
    currentBackground.classList.remove("current-background");
    currentBackground.classList.add("new-background");
    setTimeout(() => {
      currentBackground.remove(); // Remove the old background after fade-out
    }, 1000);

    // Wait 0.5 seconds on a black screen, then fade in the new background
    setTimeout(() => {
      newBackground.classList.add("current-background");
      newBackground.classList.remove("new-background");
      newBackground.style.opacity = "1"; // Fade in the new background
    }, 1500); // 0.5 seconds delay + 1 second fade-in
  } else {
    // No current background, fade in the new background directly
    newBackground.classList.add("current-background");
    newBackground.classList.remove("new-background");
    setTimeout(() => {
      newBackground.style.opacity = "1"; // Fade in the new background
    }, 10); // Small delay to ensure transition
  }
}

function saveUnlocks(unlocks) {
  if (!unlocks || typeof unlocks !== "object") return;

  const savedUnlocks = JSON.parse(localStorage.getItem("unlocks")) || {};

  Object.keys(unlocks).forEach((key) => {
    if (!savedUnlocks[key]) {
      savedUnlocks[key] = {};
    }

    Object.keys(unlocks[key]).forEach((subKey) => {
      // Check if the unlock already exists
      const isAlreadyUnlocked = Object.values(savedUnlocks[key]).some(
        (entry) => entry.id === unlocks[key][subKey],
      );

      if (!isAlreadyUnlocked) {
        // Find the next available index for the unlock
        const nextIndex = Object.keys(savedUnlocks[key]).length;
        savedUnlocks[key][nextIndex] = {
          id: unlocks[key][subKey],
          timestamp: new Date().toISOString(),
        };
      }
    });
  });

  localStorage.setItem("unlocks", JSON.stringify(savedUnlocks));
  console.log("Unlocks saved:", savedUnlocks);
}

function endStory() {
  document.title = "Tokimeki";
  const gameContainer = document.getElementById("game-container");
  const phoneContainer = document.getElementById("phone-container");
  const backgroundContainer = document.getElementById("background-container");
  if (gameContainer) {
    gameContainer.style.transition = "opacity 0.5s ease";
    gameContainer.style.opacity = "0";
    setTimeout(() => {
      gameContainer.style.display = "none";
    }, 500); // Wait for the fade-out to complete
  }
  if (backgroundContainer) {
    backgroundContainer.style.transition = "opacity 0.5s ease";
    backgroundContainer.style.opacity = "0";
    setTimeout(() => {
      backgroundContainer.remove();
    }, 500); // Wait for the fade-out to complete
  }
  if (phoneContainer) {
    phoneContainer.style.display = "flex";
    setTimeout(() => {
      phoneContainer.style.opacity = "1";
    }, 10);
  }
}

// Function to calculate delay based on dialogue length
function calculateAutoAdvanceDelay(dialogue) {
  const delay = Math.max(dialogue.length * 0.1, 1) * 1000; // Minimum 1 second
  return delay;
}

// Function to handle autoplay for story
function setupStoryAutoPlay(dialogueElement, advanceFunction) {
  let autoPlayTimer;

  function resetAutoPlayTimer() {
    clearTimeout(autoPlayTimer);
    if (autoplayCheckbox.checked) {
      const dialogue = dialogueElement.textContent || "";
      const delay = calculateAutoAdvanceDelay(dialogue);
      autoPlayTimer = setTimeout(() => {
        advanceFunction();
      }, delay);
    }
  }

  // Reset timer on user interaction
  dialogueElement.addEventListener("click", resetAutoPlayTimer);

  // Start the timer initially
  resetAutoPlayTimer();
}
