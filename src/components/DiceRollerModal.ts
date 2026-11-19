import { showToast } from "./Toast";
import { parseDiceExpression } from "../rules/personaRules";

export interface ActionRollStep {
  id: 'to_hit' | 'damage' | 'heal' | 'check';
  label: string;         // e.g. "To Hit", "Damage", "Pulihkan", "Check"
  dice: string;          // e.g. "1d20", "1d6", "3d8"
  mod: number;
  critRange?: number;    // Default 20 (can be 19 for high-crit weapons)
  subtitle?: string;     // Optional hint e.g. "Fire Damage" or "4 Rounds Burst"
}

export interface ActionRollResult {
  stepId: ActionRollStep['id'];
  dice: string;
  rolls: number[];
  keptRoll: number;
  modifier: number;
  total: number;
  isCrit: boolean;
  isFumble: boolean;
}

export interface ActionRollConfig {
  title: string;
  subtitle?: string;
  theme?: 'default' | 'persona';
  steps: ActionRollStep[];
  initialStepId?: ActionRollStep['id'];
  onRollComplete?: (result: ActionRollResult) => void;
}

function formatMod(mod: number): string {
  if (mod === 0) return "";
  return mod > 0 ? ` +${mod}` : ` ${mod}`;
}

export class DiceRollerModal {
  private modalEl: HTMLElement | null = null;
  private mode: 'free' | 'action' = 'free';
  private selectedDie: string = "d20";
  private selectedRollMode: 'normal' | 'advantage' | 'disadvantage' = 'normal';

  // Action mode state
  private actionConfig: ActionRollConfig | null = null;
  private activeStepIdx: number = 0;
  private critDoubleActive: boolean = false;

  render(): string {
    return `
      <div id="diceModal" class="modal-overlay" style="display:none;z-index:10050;">
        <div class="modal-card dice-modal-card" id="diceModalCard">
          <div class="modal-header">
            <div>
              <h3 id="diceModalTitle">Lempar Dadu TRPG</h3>
              <div id="diceModalSubtitle" class="dice-modal-subtitle" style="display:none;"></div>
            </div>
            <button class="modal-close-btn" id="closeDiceModalBtn" type="button" aria-label="Tutup">&times;</button>
          </div>
          <div class="modal-body">
            <!-- Focused Action Step Selector (only visible in Action Mode) -->
            <div id="diceActionStepsBar" class="dice-action-steps-bar" style="display:none;"></div>

            <!-- Result Box -->
            <div class="dice-result-box" id="diceModalBox">
              <span class="dice-die-type" id="diceModalDieLabel">d20</span>
              <span class="dice-result-number" id="diceModalResultNum">--</span>
            </div>
            <div class="dice-calc-details" id="diceModalDetails">Pilih dadu dan mode lemparan di bawah:</div>

            <!-- Advantage / Disadvantage toggle (shown on Free Mode or d20 Check/To-Hit) -->
            <div class="dice-mode-toggle" id="diceModeToggleRow" style="display:flex;gap:8px;margin-bottom:12px;justify-content:center;">
              <button type="button" class="btn btn-xs btn-mode active" data-mode="normal">Normal</button>
              <button type="button" class="btn btn-xs btn-mode" data-mode="advantage">Advantage (↑)</button>
              <button type="button" class="btn btn-xs btn-mode" data-mode="disadvantage">Disadvantage (↓)</button>
            </div>

            <!-- Crit Double Dice Toggle (shown on Damage step when player toggles or scored Nat 20) -->
            <div id="diceCritToggleRow" style="display:none;justify-content:center;margin-bottom:12px;">
              <button type="button" class="btn btn-xs dice-crit-toggle-btn" id="diceCritToggleBtn">
                ⚡ Critical Hit (×2 Dadu Damage)
              </button>
            </div>

            <!-- Free Mode Manual Inputs (HIDDEN in Focused Action Mode) -->
            <div id="diceFreeControls">
              <div style="display:flex;gap:8px;align-items:center;margin-bottom:12px;">
                <label style="font-size:0.8rem;color:var(--text-muted);" for="diceModifierInput">Modifier:</label>
                <input type="number" id="diceModifierInput" value="0" class="input-text" style="width:70px;text-align:center;">
                <input type="text" id="diceLabelInput" placeholder="Keterangan (misal: Power)" class="input-text" style="flex:1;">
              </div>

              <div class="dice-grid">
                <button type="button" class="btn-die" data-die="d4">d4</button>
                <button type="button" class="btn-die" data-die="d6">d6</button>
                <button type="button" class="btn-die" data-die="d8">d8</button>
                <button type="button" class="btn-die" data-die="d10">d10</button>
                <button type="button" class="btn-die" data-die="d12">d12</button>
                <button type="button" class="btn-die active" data-die="d20">d20</button>
                <button type="button" class="btn-die" data-die="d100">d100</button>
              </div>
            </div>
          </div>
          <div class="modal-footer" style="display:flex;flex-direction:column;gap:8px;">
            <button type="button" class="btn btn-primary" style="width:100%;" id="executeRollBtn">Lempar Sekarang!</button>
            <button type="button" class="btn btn-secondary" style="width:100%;display:none;" id="diceNextStepBtn">Lanjut Roll Damage</button>
          </div>
        </div>
      </div>
    `;
  }

  attachEvents() {
    this.modalEl = document.getElementById("diceModal");
    document.getElementById("closeDiceModalBtn")?.addEventListener("click", () => this.hide());
    document.getElementById("globalDiceRollBtn")?.addEventListener("click", () => this.showFree());

    this.modalEl?.addEventListener("click", (e) => {
      if (e.target === this.modalEl) this.hide();
    });

    document.querySelectorAll(".dice-mode-toggle .btn-mode").forEach((btn) => {
      btn.addEventListener("click", (e) => {
        document.querySelectorAll(".dice-mode-toggle .btn-mode").forEach(b => b.classList.remove("active"));
        const target = e.currentTarget as HTMLElement;
        target.classList.add("active");
        this.selectedRollMode = (target.dataset.mode || "normal") as 'normal' | 'advantage' | 'disadvantage';
      });
    });

    document.querySelectorAll(".dice-grid .btn-die").forEach((btn) => {
      btn.addEventListener("click", (e) => {
        document.querySelectorAll(".dice-grid .btn-die").forEach(b => b.classList.remove("active"));
        const target = e.currentTarget as HTMLElement;
        target.classList.add("active");
        this.selectedDie = target.dataset.die || "d20";
        const labelEl = document.getElementById("diceModalDieLabel");
        if (labelEl) labelEl.textContent = this.selectedDie;
      });
    });

    document.getElementById("diceCritToggleBtn")?.addEventListener("click", () => {
      this.critDoubleActive = !this.critDoubleActive;
      this.syncActionUi();
    });

    document.getElementById("diceNextStepBtn")?.addEventListener("click", () => {
      if (!this.actionConfig) return;
      const dmgIdx = this.actionConfig.steps.findIndex(s => s.id === 'damage' || s.id === 'heal');
      if (dmgIdx >= 0) {
        this.activeStepIdx = dmgIdx;
        this.syncActionUi();
        this.executeRoll();
      }
    });

    document.getElementById("executeRollBtn")?.addEventListener("click", () => this.executeRoll());
  }

  /**
   * Free Dice Roller Mode (Navbar "Lempar Dadu") — displays all 7 dice (d4..d100) + manual modifier.
   */
  showFree(prefilledDie: string = "d20", prefilledMod: number = 0, label: string = "") {
    this.ensureModal();
    if (!this.modalEl) return;

    this.mode = 'free';
    this.actionConfig = null;
    this.critDoubleActive = false;
    this.selectedDie = prefilledDie;
    this.resetRollModeToNormal();

    const card = document.getElementById("diceModalCard");
    card?.classList.remove("dice-modal-persona");

    const titleEl = document.getElementById("diceModalTitle");
    if (titleEl) titleEl.textContent = "Lempar Dadu TRPG";
    const subEl = document.getElementById("diceModalSubtitle");
    if (subEl) subEl.style.display = "none";

    const stepsBar = document.getElementById("diceActionStepsBar");
    if (stepsBar) stepsBar.style.display = "none";

    const freeControls = document.getElementById("diceFreeControls");
    if (freeControls) freeControls.style.display = "block";

    const modeRow = document.getElementById("diceModeToggleRow");
    if (modeRow) modeRow.style.display = "flex";

    const critRow = document.getElementById("diceCritToggleRow");
    if (critRow) critRow.style.display = "none";

    const nextBtn = document.getElementById("diceNextStepBtn");
    if (nextBtn) nextBtn.style.display = "none";

    const execBtn = document.getElementById("executeRollBtn");
    if (execBtn) execBtn.textContent = "Lempar Sekarang!";

    const modInput = document.getElementById("diceModifierInput") as HTMLInputElement;
    if (modInput) modInput.value = prefilledMod.toString();
    const labelInput = document.getElementById("diceLabelInput") as HTMLInputElement;
    if (labelInput) labelInput.value = label;
    const dieLabel = document.getElementById("diceModalDieLabel");
    if (dieLabel) dieLabel.textContent = prefilledDie;
    const resultNum = document.getElementById("diceModalResultNum");
    if (resultNum) resultNum.textContent = "--";
    const detailsEl = document.getElementById("diceModalDetails");
    if (detailsEl) detailsEl.textContent = "Pilih dadu dan mode lemparan di bawah:";

    document.querySelectorAll(".dice-grid .btn-die").forEach(b => {
      b.classList.toggle("active", (b as HTMLElement).dataset.die === prefilledDie);
    });

    this.modalEl.style.display = "flex";
  }

  /**
   * Focused Action Roll Mode — shows ONLY the specific dice for this action (no 7-dice grid!).
   */
  showAction(config: ActionRollConfig) {
    this.ensureModal();
    if (!this.modalEl || !config.steps.length) return;

    this.mode = 'action';
    this.actionConfig = config;
    this.critDoubleActive = false;
    this.resetRollModeToNormal();

    const initialIdx = config.initialStepId
      ? config.steps.findIndex(s => s.id === config.initialStepId)
      : 0;
    this.activeStepIdx = initialIdx >= 0 ? initialIdx : 0;

    const card = document.getElementById("diceModalCard");
    card?.classList.toggle("dice-modal-persona", config.theme === 'persona');

    const titleEl = document.getElementById("diceModalTitle");
    if (titleEl) titleEl.textContent = config.title;

    const subEl = document.getElementById("diceModalSubtitle");
    if (subEl) {
      if (config.subtitle) {
        subEl.textContent = config.subtitle;
        subEl.style.display = "block";
      } else {
        subEl.style.display = "none";
      }
    }

    const freeControls = document.getElementById("diceFreeControls");
    if (freeControls) freeControls.style.display = "none";

    const resultNum = document.getElementById("diceModalResultNum");
    if (resultNum) resultNum.textContent = "--";

    const nextBtn = document.getElementById("diceNextStepBtn");
    if (nextBtn) nextBtn.style.display = "none";

    this.renderActionStepsBar();
    this.syncActionUi();
    this.modalEl.style.display = "flex";
  }

  /**
   * Backward-compatible show():
   * - If called with no label (e.g., Navbar button) -> opens Free Mode with all 7 dice.
   * - If called with a specific action label -> automatically opens Focused Action Mode with ONLY that die!
   */
  show(prefilledDie: string = "d20", prefilledMod: number = 0, label: string = "") {
    if (!label.trim()) {
      this.showFree(prefilledDie, prefilledMod, "");
      return;
    }

    const parsed = parseDiceExpression(prefilledDie);
    const isD20Check = parsed.sides === 20 && parsed.count === 1;
    const isHeal = /pulih|heal/i.test(label);
    const stepId: ActionRollStep['id'] = isD20Check ? 'check' : (isHeal ? 'heal' : 'damage');

    this.showAction({
      title: label,
      steps: [
        {
          id: stepId,
          label: isD20Check ? 'Roll Check' : (isHeal ? 'Pulihkan' : 'Damage'),
          dice: parsed.normalized,
          mod: parsed.modifier + prefilledMod,
        },
      ],
    });
  }

  hide() {
    if (this.modalEl) this.modalEl.style.display = "none";
  }

  private ensureModal() {
    if (!this.modalEl) {
      this.modalEl = document.getElementById("diceModal");
    }
  }

  private resetRollModeToNormal() {
    this.selectedRollMode = 'normal';
    document.querySelectorAll(".dice-mode-toggle .btn-mode").forEach(b => {
      b.classList.toggle("active", (b as HTMLElement).dataset.mode === "normal");
    });
  }

  private renderActionStepsBar() {
    const bar = document.getElementById("diceActionStepsBar");
    if (!bar || !this.actionConfig) return;

    bar.style.display = "flex";
    bar.innerHTML = this.actionConfig.steps.map((step, idx) => {
      const parsed = parseDiceExpression(step.dice);
      const totalMod = parsed.modifier + step.mod;
      const formula = `${parsed.normalized}${formatMod(totalMod)}`;
      const typeClass =
        step.id === 'damage' ? 'step-damage'
        : step.id === 'heal' ? 'step-heal'
        : 'step-hit';
      return `
        <button
          type="button"
          class="dice-action-step-btn ${typeClass} ${idx === this.activeStepIdx ? 'active' : ''}"
          data-step-idx="${idx}"
        >
          <span class="step-name">${step.label}</span>
          <span class="step-formula">${formula}</span>
        </button>
      `;
    }).join("");

    bar.querySelectorAll(".dice-action-step-btn").forEach((btn) => {
      btn.addEventListener("click", (e) => {
        const idx = Number((e.currentTarget as HTMLElement).dataset.stepIdx);
        if (!Number.isNaN(idx)) {
          this.activeStepIdx = idx;
          this.syncActionUi();
        }
      });
    });
  }

  private syncActionUi() {
    if (!this.actionConfig) return;
    const step = this.actionConfig.steps[this.activeStepIdx];
    if (!step) return;

    const parsed = parseDiceExpression(step.dice);
    const effectiveCount = (step.id === 'damage' && this.critDoubleActive) ? parsed.count * 2 : parsed.count;
    const effectiveDice = `${effectiveCount}d${parsed.sides}`;
    const totalMod = parsed.modifier + step.mod;
    const formulaText = `${effectiveDice}${formatMod(totalMod)}`;

    // Highlight active tab
    document.querySelectorAll("#diceActionStepsBar .dice-action-step-btn").forEach((btn, idx) => {
      btn.classList.toggle("active", idx === this.activeStepIdx);
    });

    const dieLabel = document.getElementById("diceModalDieLabel");
    if (dieLabel) dieLabel.textContent = formulaText;

    const detailsEl = document.getElementById("diceModalDetails");
    if (detailsEl && document.getElementById("diceModalResultNum")?.textContent === "--") {
      detailsEl.textContent = step.subtitle
        ? `${step.label}: ${formulaText} • ${step.subtitle}`
        : `Siap melempar ${step.label} (${formulaText})`;
    }

    // Show Advantage/Disadvantage ONLY for d20 check / to-hit rolls
    const isD20Check = (step.id === 'to_hit' || step.id === 'check') && parsed.sides === 20 && parsed.count === 1;
    const modeRow = document.getElementById("diceModeToggleRow");
    if (modeRow) modeRow.style.display = isD20Check ? "flex" : "none";

    // Show Critical ×2 toggle on Damage rolls
    const critRow = document.getElementById("diceCritToggleRow");
    const critBtn = document.getElementById("diceCritToggleBtn");
    if (critRow && critBtn) {
      critRow.style.display = step.id === 'damage' ? "flex" : "none";
      critBtn.classList.toggle("active", this.critDoubleActive);
      critBtn.textContent = this.critDoubleActive
        ? `🔥 CRITICAL ×2 AKTIF (${effectiveDice}${formatMod(totalMod)})`
        : `⚡ Critical Hit (×2 Dadu Damage)`;
    }

    const execBtn = document.getElementById("executeRollBtn");
    if (execBtn) {
      execBtn.textContent = `Lempar ${step.label} (${formulaText})`;
    }

    const nextBtn = document.getElementById("diceNextStepBtn");
    if (nextBtn && step.id !== 'to_hit') {
      nextBtn.style.display = "none";
    }
  }

  async executeRoll() {
    const resultNumEl = document.getElementById("diceModalResultNum");
    const detailsEl = document.getElementById("diceModalDetails");
    const boxEl = document.getElementById("diceModalBox");

    boxEl?.classList.remove("is-crit", "is-fumble");
    boxEl?.classList.add("shake");
    setTimeout(() => boxEl?.classList.remove("shake"), 300);

    if (this.mode === 'action' && this.actionConfig) {
      const step = this.actionConfig.steps[this.activeStepIdx];
      if (!step) return;

      const parsed = parseDiceExpression(step.dice);
      const isD20Check = (step.id === 'to_hit' || step.id === 'check') && parsed.sides === 20 && parsed.count === 1;
      const diceCount = (step.id === 'damage' && this.critDoubleActive) ? parsed.count * 2 : parsed.count;
      const modifier = parsed.modifier + step.mod;
      const critThreshold = step.critRange || 20;

      let rolls: number[] = [];
      let keptRoll = 0;
      let detail = "";
      let isCrit = false;
      let isFumble = false;

      if (isD20Check && this.selectedRollMode !== 'normal') {
        const r1 = Math.floor(Math.random() * 20) + 1;
        const r2 = Math.floor(Math.random() * 20) + 1;
        rolls = [r1, r2];
        keptRoll = this.selectedRollMode === 'advantage' ? Math.max(r1, r2) : Math.min(r1, r2);
        isCrit = keptRoll >= critThreshold;
        isFumble = keptRoll === 1;
        detail = `${this.selectedRollMode === 'advantage' ? 'Advantage' : 'Disadvantage'}: (${r1}, ${r2}) → ${keptRoll}`;
      } else {
        for (let i = 0; i < diceCount; i++) {
          rolls.push(Math.floor(Math.random() * parsed.sides) + 1);
        }
        keptRoll = rolls.reduce((acc, v) => acc + v, 0);
        if (isD20Check) {
          isCrit = keptRoll >= critThreshold;
          isFumble = keptRoll === 1;
        }
        detail = `${diceCount}d${parsed.sides} (${rolls.join(" + ")})`;
      }

      const total = Math.max(step.id === 'damage' || step.id === 'heal' ? 1 : -99, keptRoll + modifier);
      const modStr = formatMod(modifier);
      const tagSuffix = isCrit ? " — CRITICAL HIT!" : isFumble ? " — FUMBLE!" : "";

      if (resultNumEl) resultNumEl.textContent = total.toString();
      if (detailsEl) {
        detailsEl.textContent = `${detail}${modStr} = Total ${total}${tagSuffix} • ${this.actionConfig.title}`;
      }
      if (isCrit) boxEl?.classList.add("is-crit");
      if (isFumble) boxEl?.classList.add("is-fumble");

      // If To-Hit rolled and there is a Damage/Heal step in this action, show quick continue button!
      const nextBtn = document.getElementById("diceNextStepBtn");
      const dmgStep = this.actionConfig.steps.find(s => s.id === 'damage' || s.id === 'heal');
      if (nextBtn && step.id === 'to_hit' && dmgStep) {
        if (isCrit && dmgStep.id === 'damage') {
          this.critDoubleActive = true;
        }
        const dmgParsed = parseDiceExpression(dmgStep.dice);
        const dmgCount = (dmgStep.id === 'damage' && this.critDoubleActive) ? dmgParsed.count * 2 : dmgParsed.count;
        const dmgMod = dmgParsed.modifier + dmgStep.mod;
        nextBtn.textContent = isCrit
          ? `🔥 CRITICAL! Lanjut Roll ${dmgStep.label} (${dmgCount}d${dmgParsed.sides}${formatMod(dmgMod)})`
          : `Lanjut Roll ${dmgStep.label} (${dmgCount}d${dmgParsed.sides}${formatMod(dmgMod)})`;
        nextBtn.style.display = "block";
      } else if (nextBtn) {
        nextBtn.style.display = "none";
      }

      showToast(
        `${this.actionConfig.title} — ${step.label}: ${total} (${detail}${modStr})${tagSuffix}`,
        isCrit ? "success" : "info"
      );

      this.actionConfig.onRollComplete?.({
        stepId: step.id,
        dice: `${diceCount}d${parsed.sides}`,
        rolls,
        keptRoll,
        modifier,
        total,
        isCrit,
        isFumble,
      });
      return;
    }

    // --- Free Mode Execution ---
    const modInput = document.getElementById("diceModifierInput") as HTMLInputElement;
    const modifier = parseInt(modInput?.value || "0", 10) || 0;
    const labelInput = document.getElementById("diceLabelInput") as HTMLInputElement;
    const label = labelInput?.value.trim() || "";

    const faces = parseInt(this.selectedDie.replace("d", ""), 10) || 20;
    const r1 = Math.floor(Math.random() * faces) + 1;
    let res = r1;
    let detail = `1${this.selectedDie} (${r1})`;

    if (this.selectedRollMode === "advantage") {
      const r2 = Math.floor(Math.random() * faces) + 1;
      res = Math.max(r1, r2);
      detail = `Advantage: (${r1}, ${r2}) -> Ambil ${res}`;
    } else if (this.selectedRollMode === "disadvantage") {
      const r2 = Math.floor(Math.random() * faces) + 1;
      res = Math.min(r1, r2);
      detail = `Disadvantage: (${r1}, ${r2}) -> Ambil ${res}`;
    }

    const total = res + modifier;
    const modStr = modifier >= 0 ? `+${modifier}` : `${modifier}`;
    if (resultNumEl) resultNumEl.textContent = total.toString();
    if (detailsEl) detailsEl.textContent = `${detail} ${modStr} = Total ${total}${label ? ' • ' + label : ''}`;
    showToast(`Lemparan dadu: ${total} (${detail} ${modStr})`, "info");
  }
}

export const diceRollerModal = new DiceRollerModal();
