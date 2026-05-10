# StatVision: "Cyber-Courtside" Redesign Blueprint

This document contains enhanced prompts and design system tokens for Stitch, optimized using the **Stitch Effective Prompting Guide**.

---

## 1. Global Design System (The "Cyber-Courtside" Vibe)

Apply these global tokens first to establish the "Elite Athlete" aesthetic.

| Token | Value | Rationale |
| :--- | :--- | :--- |
| **Color Mode** | `DARK` | Stadium atmosphere, high-contrast focus. |
| **Primary Color** | `#00F3FF` (Electric Blue) | High-tech, energetic, "AI-powered" feel. |
| **Secondary Color** | `#FF8C00` (Warning Orange) | Classic basketball leather, attention-grabbing. |
| **Tertiary Color** | `#FFD700` (Championship Gold) | Reward, excellence, and achievement. |
| **Headline Font** | `SPACE_GROTESK` | Bold, aggressive, and athletic. |
| **Body Font** | `INTER` | Clean, readable, and professional. |
| **Roundness** | `ROUND_TWELVE` | Modern, premium "app" feel. |

---

## 2. Master Prompt: The "Command Center" (Core Screen)

*Use this prompt in Stitch to generate the heartbeat of the application.*

> **Prompt:** 
> Generate a high-fidelity "Command Center" screen for StatVision, a cyber-courtside basketball analytics app. 
> 
> **Vibe:** Professional, High-Tech, Athletic, and Energetic. Use a deep stadium black/grey background with electric blue and warning orange accents.
> 
> **Layout Requirements:**
> 1. **Live Feed Section:** A real-time stream of AI-detected events (e.g., "3PT Made - #23 Blue") popping up with satisfying micro-animations.
> 2. **AI "Brain" Peek:** A visual indicator showing video chunks being processed in parallel, using glowing progress rings.
> 3. **Video Preview:** A centered video player with a "Scrubbable" timeline that feels buttery smooth.
> 4. **Quick Stats:** A small sidebar with "Heatmaps" on a virtual court and "Radar Charts" for current player archetypes.
> 
> **Styling:** Use a bold Space Grotesk font for stats. Micro-interactions should feel tactile and "haptic." The design should feel like an elite sports broadcast crossed with a high-end video game.

---

## 3. Targeted Iteration Prompts

*Once the Command Center is established, use these specific, incremental prompts to build the rest of the flow.*

### A. The "30-Second Setup"
> **Prompt:** "Add a new screen for 'Game Setup.' It should feel like an NBA 2K match initialization. Include a tactile drag-and-drop interface for jersey colors and a quick-select grid for rosters. High energy, bold iconography."

### B. The "Timeline Editor"
> **Prompt:** "Design the 'Timeline Editor' screen. Focus on a seamless sync between the video player and the event list. Make the timeline feel like a rhythm game—scrubbing should be buttery smooth, and verifying a shot should trigger a 'Championship Gold' visual pop."

### C. The "Mixtape Generator"
> **Prompt:** "Create a 'Mixtape' sharing interface. Highlight-reel style cards with high-energy overlays. Include a 'One-Click Share' button that glows with Electric Blue gradients. It should feel like a celebration of the player's best moments."

---

## 4. Interaction Pro-Tips
* **Satisfying Feedback:** To implement the "Verify" haptics, ask Stitch: *"When an event is verified, add a glowing Championship Gold border and a subtle scale-up animation to the card."*
* **The "Wait" is Part of the Game:** During loading states, ask Stitch: *"Replace the default spinner with a countdown animation and a 'Live Feed' of simulated event detections to build anticipation."*
