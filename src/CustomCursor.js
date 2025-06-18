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
    FOLLOWER_LAG: 0.5, // 0 to 1; closer to 0 is smoother/slower.
    TRANSITION_LAG: 0.15, // 0 to 1; closer to 0 is smoother/slower.
  };

  /**
   * Initializes the CustomCursor.
   * @param {object} [options] - Custom configuration options.
   */
  constructor(options = {}) {
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

    this._init();
  }

  /**
   * Sets up initial state, properties, and event listeners.
   * @private
   */
  _init() {
    this.hoverableItems = [
      ...document.querySelectorAll(`[${this.config.HOVERABLE_ATTR}]`),
    ];

    this.mouse = { x: window.innerWidth / 2, y: window.innerHeight / 2 };
    this.follower = { x: this.mouse.x, y: this.mouse.y };

    this.cursorDefaults = {
      width: this.cursor.offsetWidth,
      height: this.cursor.offsetHeight,
      borderRadius: this._getBorderRadius(this.cursor),
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

    // State variables
    this.scale = 1;
    this.previousHovered = null;
    this.previousHoveredZIndex = "";
    this.isLeaving = false;
    this.currentLag = this.config.FOLLOWER_LAG;

    this._addEventListeners();
    this._startLoop();
  }

  /**
   * Binds all necessary event listeners.
   * @private
   */
  _addEventListeners() {
    window.addEventListener("mousemove", (e) => this._updateMousePosition(e));
    window.addEventListener("mousedown", () => this._handleMouseDown());
    window.addEventListener("mouseup", () => this._handleMouseUp());
  }

  /**
   * Starts the main animation loop.
   * @private
   */
  _startLoop() {
    requestAnimationFrame(() => this._loop());
  }

  /**
   * The main animation loop, called on every frame.
   * This function orchestrates the series of updates needed for the cursor effect.
   * @private
   */
  _loop() {
    const hoveredElement = this._findHoveredElement();

    this._updateFollower();
    this._manageHoverState(hoveredElement);
    this._applyParallaxEffect(hoveredElement);
    this._updateCursorStyle(hoveredElement);

    requestAnimationFrame(() => this._loop());
  }

  // --- Event Handlers ---

  _updateMousePosition(e) {
    if (getComputedStyle(this.cursor).visibility === "hidden") {
      this.cursor.style.visibility = "visible";
    }
    this.mouse.x = e.clientX;
    this.mouse.y = e.clientY;
  }

  _handleMouseDown() {
    this.scale = this.cursorState.scale;
  }

  _handleMouseUp() {
    this.scale = 1;
  }

  // --- Core Logic Methods ---

  /**
   * Smoothly moves the follower element towards the mouse position based on the follower lag.
   * @private
   */
  _updateFollower() {
    // This calculation is preserved from your original code.
    if (this.config.FOLLOWER_LAG === 0) {
      this.follower.x = this.mouse.x;
      this.follower.y = this.mouse.y;
    } else {
      this.follower.x +=
        (this.mouse.x - this.follower.x) * this.config.FOLLOWER_LAG;
      this.follower.y +=
        (this.mouse.y - this.follower.y) * this.config.FOLLOWER_LAG;
    }
  }

  /**
   * Finds the currently hovered 'hoverable' element based on the follower's position.
   * @returns {HTMLElement|undefined} The hovered element or undefined.
   * @private
   */
  _findHoveredElement() {
    const followerOffsetX = this.cursorDefaults.width / 2;
    const followerOffsetY = this.cursorDefaults.height / 2;

    // This calculation is preserved from your original code.
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
   * Manages state transitions when hovering or leaving an element.
   * @param {HTMLElement|undefined} hoveredElement - The currently hovered element.
   * @private
   */
  _manageHoverState(hoveredElement) {
    if (hoveredElement === this.previousHovered) return;

    // This logic block is preserved from your original code.
    if (this.previousHovered && !hoveredElement) {
      this.isLeaving = true;
    }

    if (hoveredElement) {
      this.isLeaving = false;
    }

    this._manageZIndex(hoveredElement);
    this.previousHovered = hoveredElement;
  }

  /**
   * Manages the z-index of hovered elements to ensure they appear above the cursor.
   * @param {HTMLElement|undefined} hoveredElement - The currently hovered element.
   * @private
   */
  _manageZIndex(hoveredElement) {
    // This logic block is preserved from your original code.
    if (this.previousHovered) {
      this.previousHovered.style.zIndex = this.previousHoveredZIndex;
    }
    if (hoveredElement) {
      this.previousHoveredZIndex = getComputedStyle(hoveredElement).zIndex;
      hoveredElement.style.zIndex = (
        parseInt(getComputedStyle(this.cursor).zIndex, 10) + 1
      ).toString();
    } else {
      this.previousHoveredZIndex = "";
    }
  }

  /**
   * Applies a parallax effect to hovered elements if specified via data attributes.
   * @param {HTMLElement|undefined} hoveredElement - The currently hovered element.
   * @private
   */
  _applyParallaxEffect(hoveredElement) {
    this.hoverableItems.forEach((element) => {
      const parallax =
        Number(element.getAttribute(this.config.DATA_ATTR.PARALLAX)) || 0;
      // This calculation is preserved from your original code.
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
   * Updates the cursor's style properties (position, size, radius) based on the hover state.
   * @param {HTMLElement|undefined} hoveredElement - The currently hovered element.
   * @private
   */
  _updateCursorStyle(hoveredElement) {
    const { targetX, targetY, targetWidth, targetHeight, targetRadius } =
      this._getTargetProperties(hoveredElement);

    // This logic block for completing the 'leaving' transition is preserved.
    if (this.isLeaving) {
      if (
        Math.abs(targetWidth - this.cursorState.width) <
          this.config.FOLLOWER_LAG &&
        Math.abs(targetHeight - this.cursorState.height) <
          this.config.FOLLOWER_LAG
      ) {
        this.isLeaving = false;
      }
    }

    // --- All calculations below are preserved from your original code ---

    const transitionLag =
      this.config.TRANSITION_LAG === 0 ? 1 : this.config.TRANSITION_LAG;
    const followerLag =
      this.config.FOLLOWER_LAG === 0 ? 1 : this.config.FOLLOWER_LAG;
    const targetLag =
      hoveredElement || this.isLeaving ? transitionLag : followerLag;

    if (!hoveredElement) {
      this.currentLag += (targetLag - this.currentLag) * 0.1;
    } else {
      this.currentLag = targetLag;
    }

    this.cursorState.x += (targetX - this.cursorState.x) * this.currentLag;
    this.cursorState.y += (targetY - this.cursorState.y) * this.currentLag;
    this.cursorState.width +=
      (targetWidth - this.cursorState.width) * transitionLag;
    this.cursorState.height +=
      (targetHeight - this.cursorState.height) * transitionLag;
    this.cursorState.borderRadius +=
      (targetRadius - this.cursorState.borderRadius) * transitionLag;

    // Apply final styles to the cursor element
    this.cursor.style.left = `${this.cursorState.x}px`;
    this.cursor.style.top = `${this.cursorState.y}px`;
    this.cursor.style.width = `${this.cursorState.width}px`;
    this.cursor.style.height = `${this.cursorState.height}px`;
    this.cursor.style.borderRadius = `${this.cursorState.borderRadius}px`;
    this.cursor.style.transform = `translate(-50%, -50%) scale(${this.scale})`;
  }

  // --- Utility Methods ---

  /**
   * Determines the target properties for the cursor based on hover state.
   * @param {HTMLElement|undefined} hoveredElement - The currently hovered element.
   * @returns {object} An object with target dimensions and position.
   * @private
   */
  _getTargetProperties(hoveredElement) {
    if (hoveredElement) {
      const rect = hoveredElement.getBoundingClientRect();
      const padding =
        Number(hoveredElement.getAttribute(this.config.DATA_ATTR.PADDING)) ||
        this.config.DEFAULT_PADDING;
      this.cursorState.scale =
        Number(hoveredElement.getAttribute(this.config.DATA_ATTR.SCALE)) ||
        this.config.DEFAULT_HOVER_CLICK_SCALE;

      return {
        targetX: rect.left + rect.width / 2,
        targetY: rect.top + rect.height / 2,
        targetWidth: rect.width + padding,
        targetHeight: rect.height + padding,
        targetRadius: this._getBorderRadius(hoveredElement),
      };
    } else {
      this.cursorState.scale = this.cursorDefaults.scale;
      return {
        targetX: this.follower.x,
        targetY: this.follower.y,
        targetWidth: this.cursorDefaults.width,
        targetHeight: this.cursorDefaults.height,
        targetRadius: this.cursorDefaults.borderRadius,
      };
    }
  }

  /**
   * Utility function to get the border-radius from an element's computed style.
   * @param {HTMLElement} element - The element to get the border-radius from.
   * @returns {number} The border-radius in pixels.
   * @private
   */
  _getBorderRadius(element) {
    const radiusStr = getComputedStyle(element).borderRadius;
    const radius = parseInt(radiusStr, 10);

    if (isNaN(radius)) return 0;

    // This calculation is preserved from your original code.
    if (
      radius > Math.min(element.offsetWidth, element.offsetHeight) ||
      element.classList.contains("rounded-full")
    ) {
      return Math.min(element.offsetWidth, element.offsetHeight);
    }

    return radius;
  }
}
