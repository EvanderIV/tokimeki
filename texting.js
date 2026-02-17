let autoAdvanceTimeout;

function playTextingChain(jsonFilename) {
  if (!jsonFilename || typeof jsonFilename !== "string") {
    console.error("Invalid JSON filename provided to playTextingChain.");
    return;
  }

  fetch(`scripts/texting/${jsonFilename}`)
    // REPLACE WITH PATH TO PHP API AFTER TESTING
    .then((response) => response.json())
    .then((json) => {
      logDebug("Fetched texting JSON", json); // Debug log for fetched JSON

      const predefinedConstantsPath =
        json.constants?.paths?.predefinedConstants;

      if (predefinedConstantsPath) {
        fetch(predefinedConstantsPath)
          .then((response) => response.json())
          .then((constants) => {
            storyVariables.constants = {
              ...storyVariables.constants,
              ...constants,
            };
            logDebug("Predefined constants loaded", constants);

            // Parse the texting JSON after loading constants
            parseMetadataAndConstants(json);
            parseTextingChain(json);
          })
          .catch((error) =>
            console.error("Error loading predefined constants:", error),
          );
      } else {
        // If no predefined constants path, proceed with parsing the texting JSON
        parseMetadataAndConstants(json);
        parseTextingChain(json);
      }
    })
    .catch((error) => logDebug("Error loading texting JSON", error));
}

function parseTextingChain(json) {
  console.log("Parsing texting JSON", json); // Debug log for texting chain parsing
  const textingStack = [{ story: json.story || json, progress: [] }]; // Stack to manage texting contexts with progress tracking

  function peekNextState() {
    if (textingStack.length === 0) {
      console.log("No more content to peek at.");
      return { stackLength: 0, nextCharacter: null, nextDialogue: null }; // Return empty state if the stack is empty
    }

    const simulateStack = [...textingStack]; // Clone the texting stack to simulate changes

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

  function processTextingEntry(autoTrigger = false) {
    if (textingStack.length === 0) {
      console.log("Texting Chain Ended: No more content to process.");
      endTextingChain();
      return;
    }

    const currentContext = textingStack[textingStack.length - 1];
    const { story, progress } = currentContext;

    // Find the next unprocessed entry
    const nextEntry = story.find((entry) => !progress.includes(entry));

    if (!nextEntry) {
      textingStack.pop(); // Exit the current texting context
      processTextingEntry(); // Continue with the previous context
      return;
    }

    progress.push(nextEntry); // Mark the entry as processed
    logDebug("Processing texting entry", nextEntry);

    const { character, dialogue, responses, branch, unlocks } = nextEntry;

    if (unlocks) {
      logDebug("Saving unlocks", unlocks);
      saveUnlocks(unlocks);
    }

    // Handle branch objects
    if (branch) {
      const { condition, story: branchStory } = branch;
      logDebug("Evaluating branch condition", condition);
      if (evaluateCondition(condition)) {
        logDebug("Branch condition met, processing branch story", branchStory);
        textingStack.push({ story: branchStory, progress: [] }); // Push the branch story onto the stack
        processTextingEntry();
      } else {
        logDebug("Branch condition not met, skipping branch.", condition);
        processTextingEntry(); // Continue with the current story
      }
      return; // Wait for user input
    }

    // Handle dialogue
    if (dialogue) {
      logDebug("Displaying dialogue", dialogue);

      displayText(dialogue, character); // Pass character to displayText

      // Auto-advance dialogue if autoplay is enabled in localStorage
      if (localStorage.getItem("autoplay") === "true") {
        logDebug("Autoplay is enabled, setting up auto-advance for dialogue.", {
          dialogue,
        });
        autoAdvanceStoryTimeout = setTimeout(
          () => {
            const event = new Event("click");
            document.dispatchEvent(event);
          },
          dialogue.length > 10 ? dialogue.length * 70 : 1000,
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

      // Check if there is another message in the texting stack
      const hasNextMessage = peekNextState().stackLength > 0;
      let typingIndicator;

      if (hasNextMessage) {
        typingIndicator = displayTypingIndicator(
          peekNextState().nextCharacter === null, // Show user typing indicator if the next message has no character
        ); // Show typing indicator
        console.log(
          "Displayed typing indicator for next message.",
          peekNextState().stackLength,
          peekNextState().nextCharacter,
          peekNextState().nextDialogue,
        );
      } else {
        logDebug(
          "No more messages in the current story, not showing typing indicator.",
          textingStack,
        );
      }

      if (autoTrigger) {
        // Automatically proceed for the first event
        setTimeout(() => {
          if (typingIndicator) removeTypingIndicator(typingIndicator);
          processTextingEntry();
        }, 100);
        return;
      }

      // Ensure we wait for user interaction before progressing
      const waitForClick = () => {
        document.removeEventListener("click", waitForClick);
        if (typingIndicator) removeTypingIndicator(typingIndicator);
        processTextingEntry();
      };

      document.addEventListener("click", waitForClick);
      return; // Wait for user input
    }

    // Handle responses
    if (responses) {
      logDebug("Displaying responses", responses);
      displayTextingChoices(responses, processTextingEntry, { current: 0 });
      return; // Wait for user to select a response
    }

    // Automatically proceed for the first event if autoTrigger is true
    if (autoTrigger) {
      processTextingEntry();
      return;
    }

    // Wait for user interaction before progressing
    const waitForClick = () => {
      document.removeEventListener("click", waitForClick);
      processTextingEntry();
    };
    document.addEventListener("click", waitForClick);
  }

  processTextingEntry(true); // Trigger the first event automatically
}

function revealTextingContainer() {
  const textingContainer = document.getElementById("texting-container");
  if (textingContainer) {
    textingContainer.style.display = "block";
  } else {
    console.error("Texting container not found.");
  }
}

function displayText(dialogue, character) {
  const messageList = document.getElementById("message-list");
  if (!messageList) {
    console.error("Message list container not found.");
    return;
  }

  const messageItem = document.createElement("div");
  messageItem.classList.add("message-item");

  if (character) {
    messageItem.classList.add("character-message"); // Left-justified for characters

    // Add character image
    const characterImage = document.createElement("img");
    characterImage.src = `assets/characters/${character}/texting.png`;
    characterImage.alt = `${character} avatar`;
    characterImage.classList.add("character-avatar");

    // Apply background color from predefined constants
    applyCharacterStylesTexting(character);

    messageItem.appendChild(characterImage);
  } else {
    messageItem.classList.add("user-message"); // Right-justified for user
  }

  const messageText = document.createElement("div");
  messageText.classList.add("message-text");
  messageText.textContent = dialogue;
  messageItem.appendChild(messageText);

  messageList.appendChild(messageItem);

  // Scroll to the bottom of the message list
  messageList.scrollTop = messageList.scrollHeight;
}

function displayTextingChoices(options, processEntry, currentIndexRef) {
  const messageList = document.getElementById("message-list");
  if (!messageList) {
    console.error("Message list container not found.");
    return;
  }

  // Create a container for the choices
  const choiceMessage = document.createElement("div");
  choiceMessage.classList.add("message-item", "user-message"); // Style as a user message

  const choiceList = document.createElement("div");
  choiceList.classList.add("choice-list"); // Add a class for styling the choice list

  options.forEach((option) => {
    const choiceButton = document.createElement("button");
    choiceButton.textContent = option.text;
    choiceButton.classList.add("choice-button");

    choiceButton.addEventListener("click", () => {
      // Replace the choices with the selected option's text
      choiceMessage.innerHTML = `<div class='selected-choice'>${option.text}</div>`;

      if (option.effects) {
        applyEffects(option.effects);
      }
      if (option.toast) {
        showToast(option.toast, option.effects);
      }

      // Add a timeout before re-enabling click listeners
      setTimeout(() => {
        processEntry();
      }, 100);
    });

    choiceList.appendChild(choiceButton);
  });

  choiceMessage.appendChild(choiceList);
  messageList.appendChild(choiceMessage);

  // Scroll to the bottom of the message list
  messageList.scrollTop = messageList.scrollHeight;
}

function endTextingChain() {
  document.title = "Tokimeki";
  console.log("Texting chain has ended.");
  const textingContainer = document.getElementById("texting-container");
  if (textingContainer) {
    textingContainer.classList.remove("show");
    setTimeout(() => {
      textingContainer.style.display = "none";
    }, 500); // Match the CSS transition duration
  }
}

function displayTypingIndicator(isUser = false) {
  const messageList = document.getElementById("message-list");
  if (!messageList) {
    console.error("Message list container not found.");
    return;
  }

  const typingIndicator = document.createElement("div");
  typingIndicator.classList.add("message-item", "typing-indicator");
  if (isUser) {
    typingIndicator.classList.add("user-message");
  } else {
    typingIndicator.classList.add("character-message");
  }

  const typingDots = document.createElement("div");
  typingDots.classList.add("typing-dots");

  for (let i = 0; i < 3; i++) {
    const dot = document.createElement("span");
    typingDots.appendChild(dot);
  }

  typingIndicator.appendChild(typingDots);
  messageList.appendChild(typingIndicator);

  // Scroll to the bottom of the message list
  messageList.scrollTop = messageList.scrollHeight;

  return typingIndicator; // Return the element for removal later
}

function removeTypingIndicator(typingIndicator) {
  if (typingIndicator && typingIndicator.parentElement) {
    typingIndicator.parentElement.removeChild(typingIndicator);
  }
}

function applyCharacterStylesTexting(character) {
  const characterStyles = storyVariables.constants?.defaultColors?.[character];

  if (characterStyles) {
    const characterImages = document.querySelectorAll(
      `.character-avatar[alt='${character} avatar']`,
    );

    characterImages.forEach((img) => {
      img.style.backgroundColor = characterStyles;
    });
  } else {
    console.warn(`No styles found for character: ${character}`);
  }
}

// Function to calculate delay based on dialogue length
function calculateAutoAdvanceDelay(dialogue) {
  const delay = Math.max(dialogue.length * 0.1, 1) * 1000; // Minimum 1 second
  return delay;
}

// Function to handle autoplay for texting
function setupTextingAutoPlay(dialogueElement, advanceFunction) {
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
