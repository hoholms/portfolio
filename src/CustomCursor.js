"use strict";

/**
 * @class CustomCursor
 * Manages a custom cursor effect that interacts with 'hoverable' elements.
 * The cursor changes its shape and size to match the hovered element,
 * provides a parallax effect, and scales on click.
 */
export class CustomCursor {
  /**
   * Configuration constants for the cursor.
   * @private
   */
  static CONFIG = {
    CURSOR_ID: "cursor",
    HOVERABLE_ATTR: "hoverable",
    DATA_ATTR: {
      PADDING: "data-cursor-padding",
      SCALE: "data-cursor-scale",
      PARALLAX: "data-cursor-parallax",
    },
    DEFAULT_PADDING: 15,
    DEFAULT_CLICK_SCALE: 0.9,
    DEFAULT_HOVER_CLICK_SCALE: 0.98,
    FOLLOWER_LAG: 1, // Determines how smoothly the follower tracks the mouse (1 is fastest, 0 – not moving)
    TRANSITION_LAG: 0.1, // Determines the speed of visual transitions (size, position, radius; 1 is instant, 0 – not moving)
  };

  /**
   * Initializes the CustomCursor.
   * @param {object} [options] - Custom configuration options.
   */
  constructor(options = {}) {
    // Merge user options with default config
    this.config = { ...CustomCursor.CONFIG, ...options };

    this.cursor = document.getElementById(this.config.CURSOR_ID);

    // Do not initialize on touch devices or if the cursor element is not found
    const isTouchDevice =
      "ontouchstart" in window || navigator.maxTouchPoints > 0;
    if (!this.cursor || isTouchDevice) {
      console.warn(
        "Custom cursor not initialized: not on a desktop device or cursor element not found.",
      );
      return;
    }

    this.init();
  }

  /**
   * Sets up initial state, properties, and event listeners.
   * @private
   */
  init() {
    this.hoverableItems = [
      ...document.querySelectorAll(`[${this.config.HOVERABLE_ATTR}]`),
    ];

    this.mouse = { x: window.innerWidth / 2, y: window.innerHeight / 2 };
    this.follower = { x: this.mouse.x, y: this.mouse.y };

    this.cursorDefaults = {
      width: this.cursor.offsetWidth,
      height: this.cursor.offsetHeight,
      borderRadius: this.getBorderRadius(this.cursor),
      scale: this.config.DEFAULT_CLICK_SCALE,
    };

    this.cursorState = {
      x: this.follower.x,
      y: this.follower.y,
      width: this.cursorDefaults.width,
      height: this.cursorDefaults.height,
      borderRadius: this.cursorDefaults.borderRadius,
      scale: this.cursorDefaults.scale,
    };

    this.scale = 1;
    this.previousHovered = null;
    this.previousZIndex = "";

    this.addEventListeners();
    this.startLoop();
  }

  /**
   * Binds all necessary event listeners.
   * @private
   */
  addEventListeners() {
    window.addEventListener("mousemove", this.updateMousePosition.bind(this));
    window.addEventListener("mousedown", this.handleMouseDown.bind(this));
    window.addEventListener("mouseup", this.handleMouseUp.bind(this));
  }

  /**
   * Updates the mouse coordinates and ensures the cursor is visible.
   * @param {MouseEvent} e - The mousemove event.
   */
  updateMousePosition(e) {
    // A small fix to prevent flickering on first mouse move
    if (getComputedStyle(this.cursor).visibility === "hidden") {
      this.cursor.style.visibility = "visible";
    }
    this.mouse.x = e.clientX;
    this.mouse.y = e.clientY;
  }

  /**
   * Handles the mousedown event to apply click scaling.
   */
  handleMouseDown() {
    this.scale = this.cursorState.scale;
  }

  /**
   * Handles the mouseup event to reset click scaling.
   */
  handleMouseUp() {
    this.scale = 1;
  }

  /**
   * Starts the main animation loop.
   * @private
   */
  startLoop() {
    this.loop();
  }

  /**
   * The main animation loop, called on every frame.
   * @private
   */
  loop() {
    this.updateFollower();
    const hoveredElement = this.findHoveredElement();
    this.manageHoverState(hoveredElement);
    this.applyParallaxEffect(hoveredElement);
    this.updateCursorStyle(hoveredElement);

    requestAnimationFrame(this.loop.bind(this));
  }

  /**
   * Smoothly moves the follower element towards the mouse position.
   * @private
   */
  updateFollower() {
    this.follower.x +=
      (this.mouse.x - this.follower.x) * this.config.FOLLOWER_LAG;
    this.follower.y +=
      (this.mouse.y - this.follower.y) * this.config.FOLLOWER_LAG;
  }

  /**
   * Finds the currently hovered 'hoverable' element.
   * @returns {HTMLElement|undefined} The hovered element or undefined.
   * @private
   */
  findHoveredElement() {
    const followerOffsetX = this.cursorDefaults.width / 2;
    const followerOffsetY = this.cursorDefaults.height / 2;

    return this.hoverableItems.find((element) => {
      const rect = element.getBoundingClientRect();
      return (
        this.follower.x + followerOffsetX >= rect.left &&
        this.follower.y + followerOffsetY >= rect.top &&
        this.follower.x - followerOffsetX <= rect.right &&
        this.follower.y - followerOffsetY <= rect.bottom
      );
    });
  }

  /**
   * Manages z-index changes when an element is hovered or unhovered.
   * @param {HTMLElement|undefined} hoveredElement - The currently hovered element.
   * @private
   */
  manageHoverState(hoveredElement) {
    if (hoveredElement === this.previousHovered) return;

    // Reset z-index of the previously hovered element
    if (this.previousHovered) {
      this.previousHovered.style.zIndex = this.previousZIndex;
    }

    if (hoveredElement) {
      // Store and update z-index for the new hovered element
      this.previousZIndex = getComputedStyle(hoveredElement).zIndex;
      hoveredElement.style.zIndex = (
        parseInt(getComputedStyle(this.cursor).zIndex, 10) + 1
      ).toString();
      this.previousHovered = hoveredElement;
    } else {
      this.previousHovered = null;
      this.previousZIndex = "";
    }
  }

  /**
   * Applies a parallax effect to hovered elements if specified.
   * @param {HTMLElement|undefined} hoveredElement - The currently hovered element.
   * @private
   */
  applyParallaxEffect(hoveredElement) {
    this.hoverableItems.forEach((element) => {
      const parallax =
        Number(element.getAttribute(this.config.DATA_ATTR.PARALLAX)) || 0;
      if (parallax > 0 && element === hoveredElement) {
        const rect = element.getBoundingClientRect();
        const relX = (this.mouse.x - rect.left) / rect.width - 0.5;
        const relY = (this.mouse.y - rect.top) / rect.height - 0.5;
        element.style.transform = `translate(${relX * parallax}px, ${relY * parallax}px)`;
      } else {
        element.style.transform = "translate(0, 0)";
      }
    });
  }

  /**
   * Updates the cursor's style properties based on the hover state.
   * @param {HTMLElement|undefined} hoveredElement - The currently hovered element.
   * @private
   */
  updateCursorStyle(hoveredElement) {
    let targetX, targetY, targetWidth, targetHeight, targetRadius;

    if (hoveredElement) {
      const rect = hoveredElement.getBoundingClientRect();
      const padding =
        Number(hoveredElement.getAttribute(this.config.DATA_ATTR.PADDING)) ||
        this.config.DEFAULT_PADDING;

      targetX = rect.left + rect.width / 2;
      targetY = rect.top + rect.height / 2;
      targetWidth = rect.width + padding;
      targetHeight = rect.height + padding;
      targetRadius = this.getBorderRadius(hoveredElement);
      this.cursorState.scale =
        Number(hoveredElement.getAttribute(this.config.DATA_ATTR.SCALE)) ||
        this.config.DEFAULT_HOVER_CLICK_SCALE;
    } else {
      targetX = this.follower.x;
      targetY = this.follower.y;
      targetWidth = this.cursorDefaults.width;
      targetHeight = this.cursorDefaults.height;
      targetRadius = this.cursorDefaults.borderRadius;
      this.cursorState.scale = this.cursorDefaults.scale;
    }

    // Apply smooth transitions (lerp)
    this.cursorState.x +=
      (targetX - this.cursorState.x) * this.config.TRANSITION_LAG;
    this.cursorState.y +=
      (targetY - this.cursorState.y) * this.config.TRANSITION_LAG;
    this.cursorState.width +=
      (targetWidth - this.cursorState.width) * this.config.TRANSITION_LAG;
    this.cursorState.height +=
      (targetHeight - this.cursorState.height) * this.config.TRANSITION_LAG;
    // Interpolating border radius directly for a smoother transition.
    this.cursorState.borderRadius +=
      (targetRadius - this.cursorState.borderRadius) *
      this.config.TRANSITION_LAG;

    // Apply styles to the cursor element
    this.cursor.style.left = `${this.cursorState.x}px`;
    this.cursor.style.top = `${this.cursorState.y}px`;
    this.cursor.style.width = `${this.cursorState.width}px`;
    this.cursor.style.height = `${this.cursorState.height}px`;
    this.cursor.style.borderRadius = `${this.cursorState.borderRadius}px`;
    this.cursor.style.transform = `translate(-50%, -50%) scale(${this.scale})`;
  }

  /**
   * Utility function to get the border-radius from a CSS value.
   * @param {HTMLElement} element - The element to get the border-radius from.
   * @returns {number} The border-radius in pixels.
   * @private
   */
  getBorderRadius(element) {
    const radiusStr = getComputedStyle(element).borderRadius;
    const radius = parseInt(radiusStr, 10);

    if (isNaN(radius)) {
      return 0;
    }
    // Handle cases for fully rounded elements (e.g., 9999px)
    if (
      radius > Math.min(element.offsetWidth, element.offsetHeight) ||
      element.classList.contains("rounded-full")
    ) {
      return Math.min(element.offsetWidth, element.offsetHeight);
    }

    return radius;
  }
}
