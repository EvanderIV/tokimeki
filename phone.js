document.addEventListener("DOMContentLoaded", () => {
  const textingApp = document.getElementById("texting-app");
  const mapApp = document.getElementById("map-app");
  const settingsApp = document.getElementById("settings-app");
  const creditsApp = document.getElementById("credits-app");

  const buttons = {
    "view-texts": textingApp,
    "view-map": mapApp,
    "view-settings": settingsApp,
    "view-credits": creditsApp,
  };

  Object.keys(buttons).forEach((buttonId) => {
    document.getElementById(buttonId).addEventListener("click", () => {
      Object.values(buttons).forEach((app) => (app.style.display = "none"));
      buttons[buttonId].style.display = "flex";
    });
  });

  // Settings App Interactivity
  const sexOptions = document.querySelectorAll(".sex-option");
  sexOptions.forEach((option) => {
    option.addEventListener("click", () => {
      option.classList.toggle("selected"); // Toggle selection state
    });
  });

  const autoplayCheckbox = document.getElementById("autoplay");
  // Load saved autoplay preference from localStorage
  const savedAutoplay = localStorage.getItem("autoplay");
  if (savedAutoplay !== null) {
    autoplayCheckbox.checked = savedAutoplay === "true";
  }

  autoplayCheckbox.addEventListener("change", () => {
    const isChecked = autoplayCheckbox.checked;
    localStorage.setItem("autoplay", isChecked);
    console.log("Autoplay Story:", isChecked);
  });

  const themeDropdown = document.getElementById("theme");
  const phoneScreen = document.getElementById("phone-screen");

  // Update app theme visibility
  const appThemes = ["unmasked-royal", "cotton-candy", "sakura"];
  const appThemeClasses = appThemes.map((theme) => `app-theme-${theme}`);

  function updateAppThemeVisibility(selectedTheme) {
    // Remove all app-theme classes from the body
    document.body.classList.remove(...appThemeClasses);

    // Add the selected app-theme class to the body
    if (selectedTheme) {
      document.body.classList.add(`app-theme-${selectedTheme}`);
      localStorage.setItem("theme", selectedTheme);
      loadTheme(selectedTheme);
    }
  }

  // Load saved theme from localStorage or set default theme
  const savedTheme = localStorage.getItem("theme") || "unmasked-royal";
  themeDropdown.value = savedTheme;
  updateAppThemeVisibility(savedTheme);

  themeDropdown.addEventListener("change", () => {
    const selectedTheme = themeDropdown.value;

    // Update app theme visibility
    updateAppThemeVisibility(selectedTheme);
  });

  // Initialize app theme visibility on page load
  if (savedTheme) {
    updateAppThemeVisibility(savedTheme);
  }

  const viewCreditsButton = document.getElementById("view-credits");
  const closeCreditsButton = document.getElementById("close-credits");

  viewCreditsButton.addEventListener("click", () => {
    settingsApp.style.display = "none";
    creditsApp.style.display = "flex";

    const paragraphs = creditsApp.querySelectorAll("p");
    paragraphs.forEach((p, index) => {
      setTimeout(() => {
        p.classList.add("show");
      }, index * 100); // 0.1s delay between each
    });

    setTimeout(() => {
      creditsApp.classList.add("show"); // Apply 'show' class to the background div
    }, 10);
  });

  closeCreditsButton.addEventListener("click", () => {
    creditsApp.style.display = "none";
    settingsApp.style.display = "flex";

    const paragraphs = creditsApp.querySelectorAll("p");
    paragraphs.forEach((p) => {
      p.classList.remove("show");
    });

    creditsApp.classList.remove("show");
  });

  function loadTheme(theme) {
    switch (theme) {
      case "unmasked-royal":
        document.documentElement.style.setProperty(
          "--primary-color",
          "#d00000",
        );
        document.documentElement.style.setProperty("--secondary-color", "#000");
        document.documentElement.style.setProperty("--accent-color", "#fff");
        document.documentElement.style.setProperty("--text-color", "#fff"); // Default white text
        document.documentElement.style.setProperty("--outline-color", "#000");
        document.documentElement.style.setProperty("--bezel-color", "#333");
        console.log("Theme changed to Unmasked Royal");
        break;
      case "cotton-candy":
        console.log("Theme changed to Cotton Candy");
        document.documentElement.style.setProperty(
          "--primary-color",
          "#f7d6e0",
        ); // Soft pink
        document.documentElement.style.setProperty(
          "--secondary-color",
          "#d3c4f3",
        ); // Lavender
        document.documentElement.style.setProperty("--accent-color", "#e8e2f7"); // Light lilac
        document.documentElement.style.setProperty("--text-color", "#000"); // Black text for readability
        document.documentElement.style.setProperty(
          "--outline-color",
          "#e8e2f7",
        );
        document.documentElement.style.setProperty("--bezel-color", "#bbc");
        break;
      case "sakura":
        console.log("Theme changed to Sakura");
        document.documentElement.style.setProperty(
          "--primary-color",
          "#a2cae6",
        ); // Soft sky blue
        document.documentElement.style.setProperty(
          "--secondary-color",
          "#d3c4f3",
        ); // Lavender
        document.documentElement.style.setProperty("--accent-color", "#e8e2f7"); // Light lilac
        document.documentElement.style.setProperty("--text-color", "#000"); // Black text for readability
        document.documentElement.style.setProperty(
          "--outline-color",
          "#e8e2f7",
        );
        document.documentElement.style.setProperty("--bezel-color", "#cac");
        break;
      default:
        console.log("Theme reset to default");
    }
  }

  // Function to load texting chains from localStorage
  async function loadTextingChains() {
    const textingList = document.getElementById("texting-list");
    textingList.innerHTML = ""; // Clear existing list

    const savedUnlocks = JSON.parse(localStorage.getItem("unlocks")) || {};
    const texts = savedUnlocks.texts || {};

    // Fetch the constants file for default colors
    const constantsResponse = await fetch("const/default.json");
    const constantsData = constantsResponse.ok
      ? await constantsResponse.json()
      : {};
    const defaultColors = constantsData.constants?.defaultColors || {};

    // Reverse the order of keys to display the latest unlocks first
    const keys = Object.keys(texts).sort((a, b) => b - a);

    for (const key of keys) {
      const textData = texts[key];

      // Fetch the JSON file for the text chain
      const response = await fetch(`scripts/texting/${textData.id}.json`);
      // REPLACE WITH PATH TO PHP API AFTER TESTING
      if (!response.ok) {
        console.error(`Failed to load texting data for ${textData.id}`);
        continue;
      }

      const textJson = await response.json();
      const primaryCharacter = textJson.metadata.primaryCharacter || "default";

      // Create a wrapper div for the text chain
      const wrapper = document.createElement("div");
      wrapper.classList.add("text-chain-wrapper");
      wrapper.addEventListener("click", () => {
        openTextingChain(textData.id); // Function to handle opening the text chain
      });

      // Create a wrapper for the avatar
      const avatarWrapper = document.createElement("div");
      avatarWrapper.classList.add("text-chain-avatar-wrapper");

      // Create a wrapper for the avatar background
      const avatarBgWrapper = document.createElement("div");
      avatarBgWrapper.classList.add("text-chain-avatar-bg-wrapper");

      // Create a wrapper for the avatar background
      const avatarMaskWrapper = document.createElement("div");
      avatarMaskWrapper.classList.add("text-chain-avatar-mask-wrapper");

      // Create an image element for the avatar
      const avatar = document.createElement("img");
      avatar.src = `assets/characters/${primaryCharacter}/texting.png`;
      avatarMaskWrapper.style.backgroundColor =
        defaultColors[primaryCharacter] || "transparent"; // Set background color based on constants
      avatar.alt = `${primaryCharacter} avatar`;
      avatar.classList.add("text-chain-avatar");

      // Set the background color if the primaryCharacter has a default color
      const backgroundColor = defaultColors[primaryCharacter];
      if (backgroundColor) {
        avatar.style.backgroundColor = backgroundColor;
      }

      avatarMaskWrapper.appendChild(avatar); // Add the avatar to the background wrapper
      avatarWrapper.appendChild(avatarBgWrapper); // Add the background wrapper to the avatar wrapper
      avatarBgWrapper.appendChild(avatarMaskWrapper); // Add the background wrapper to the avatar wrapper
      wrapper.appendChild(avatarWrapper); // Add the avatar wrapper to the main wrapper

      // Create a wrapper for the text chain name
      const nameWrapper = document.createElement("div");
      nameWrapper.classList.add("text-chain-name-wrapper");

      // Create a strong element for the text chain name
      const textName = document.createElement("strong");
      textName.textContent = textJson.metadata.storyName; // Display the text ID or name

      nameWrapper.appendChild(textName); // Add the strong element to the name wrapper
      wrapper.appendChild(nameWrapper); // Add the name wrapper to the main wrapper

      textingList.appendChild(wrapper); // Add the wrapper to the list
    }
  }

  // Function to handle opening a texting chain
  function openTextingChain(textId) {
    console.log("Opening text chain:", textId);

    // Reveal the texting container
    const textingContainer = document.getElementById("texting-container");
    if (textingContainer) {
      textingContainer.style.display = "flex";
      setTimeout(() => {
        textingContainer.classList.add("show");
      }, 10);
    } else {
      console.error("Texting container not found.");
      return;
    }

    // Clear the message list
    const messageList = document.getElementById("message-list");
    if (messageList) {
      messageList.innerHTML = "";
    } else {
      console.error("Message list not found.");
      return;
    }

    // Use playTextingChain to load and play the texting chain
    playTextingChain(`${textId}.json`);
  }

  // Call the function to load texting chains on app load
  loadTextingChains();
});
