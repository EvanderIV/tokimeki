document.addEventListener("DOMContentLoaded", () => {
  const scene = document.getElementById("scene");
  const dialogueText = document.getElementById("dialogue-text");
  const choices = document.getElementById("choices");

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
          charElement.style.transition =
            "transform 0.5s ease, opacity 0.5s ease";
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
  }

  function displayCharacterName(character, position) {
    let nameTag = document.getElementById("character-name-tag");

    if (!nameTag) {
      nameTag = document.createElement("div");
      nameTag.id = "character-name-tag";
      document.body.appendChild(nameTag);
    }

    if (character) {
      nameTag.textContent = character;
      nameTag.style.display = "block";

      if (position === "left") {
        nameTag.style.left = "10%";
        nameTag.style.top = "calc(70% - 50px)"; // Above the dialogue box
      } else if (position === "right") {
        nameTag.style.left = "70%";
        nameTag.style.top = "calc(70% - 50px)"; // Above the dialogue box
      } else {
        nameTag.style.left = "10%"; // Left rule of thirds for center position
        nameTag.style.top = "calc(70% - 50px)"; // Above the dialogue box
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
    options.forEach((option) => {
      const button = document.createElement("button");
      button.textContent = option.text;
      button.classList.add("choice");
      button.addEventListener("click", () => {
        if (option.effects) {
          applyEffects(option.effects);
        }
        if (option.toast) {
          showToast(option.toast, option.effects);
        }
        choices.innerHTML = ""; // Remove choice buttons from the DOM
        currentIndexRef.current++; // Progress the story
        processEntry();
      });
      choices.appendChild(button);
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
    const currentIndexRef = { current: 0 };

    // Call parseMetadataAndConstants on story load
    parseMetadataAndConstants(json);

    function processEntry() {
      if (currentIndexRef.current >= json.length) return;

      const entry = json[currentIndexRef.current];
      logDebug("Processing story entry", entry);

      const {
        character,
        state,
        outfit,
        position,
        sfx,
        vfx,
        dialogue,
        responses,
        branch,
      } = entry;

      // Handle branch objects
      if (branch) {
        const { condition, story: branchStory } = branch;
        logDebug("Evaluating branch condition", condition);
        if (evaluateCondition(condition)) {
          logDebug(
            "Branch condition met, processing branch story",
            branchStory,
          );
          parseStory(branchStory);
        }

        // Wait for user interaction before progressing
        const waitForClick = () => {
          document.removeEventListener("click", waitForClick);
          currentIndexRef.current++; // Move to the next entry after the branch
          processEntry();
        };

        // Add a delay before registering the click event listener to prevent double-firing
        setTimeout(() => {
          document.addEventListener("click", waitForClick);
        }, 100);

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
        currentIndexRef.current++; // Move to the next entry
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
        currentIndexRef.current++; // Move to the next entry
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

        // Ensure we wait for user interaction before progressing
        const waitForClick = () => {
          document.removeEventListener("click", waitForClick);
          currentIndexRef.current++; // Move to the next entry
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
        displayChoices(responses, processEntry, currentIndexRef);
        return; // Wait for user to select a response
      }

      currentIndexRef.current++; // Move to the next entry
      processEntry();
    }

    processEntry();
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
  fetch("scripts/story.json")
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
});
