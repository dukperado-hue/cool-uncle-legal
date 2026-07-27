/**
 * ================================================================
 * TTS HELPER - Text-to-Speech for Thai Content
 * ใช้ได้กับ Web Speech API (Browser-native)
 * ⚠️ สำหรับอ่านเสริมเท่านั้น - ไม่ใช่เพื่อแทนที่การศึกษาโดยตรง
 * ================================================================
 */

class ThaiTTSHelper {
  constructor(options = {}) {
    this.isSpeak = false;
    this.rate = options.rate || 1;
    this.pitch = options.pitch || 1;
    this.volume = options.volume || 1;
    this.lang = 'th-TH';
    this.utterance = null;
    
    // Check browser support
    this.isSupported = 'speechSynthesis' in window;
    if (!this.isSupported) {
      console.warn('⚠️ Speech Synthesis API not supported in this browser');
    }
  }

  /**
   * สร้าง button สำหรับอ่านข้อความ
   * @param {string} containerId - ID ของ element ที่จะใส่ button
   * @param {array} textElements - Array ของ element IDs ที่จะอ่าน
   */
  createAudioControl(containerId, textElements = []) {
    if (!this.isSupported) return;

    const container = document.getElementById(containerId);
    if (!container) return;

    container.innerHTML = `
      <div class="audio-control">
        <button id="btn-tts-speak" onclick="thaiTTS.toggleSpeak()">
          🔊 อ่านหน้านี้
        </button>
        <div class="speed-control">
          <label>ความเร็ว:</label>
          <input type="range" id="tts-speed" min="0.5" max="2" step="0.1" value="${this.rate}">
          <span id="tts-speed-display">${this.rate}x</span>
        </div>
        <div class="pitch-control">
          <label>เสียง:</label>
          <input type="range" id="tts-pitch" min="0.5" max="2" step="0.1" value="${this.pitch}">
          <span id="tts-pitch-display">${this.pitch}x</span>
        </div>
      </div>
    `;

    // Event listeners
    document.getElementById('tts-speed')?.addEventListener('change', (e) => {
      this.rate = parseFloat(e.target.value);
      document.getElementById('tts-speed-display').textContent = this.rate.toFixed(1) + 'x';
    });

    document.getElementById('tts-pitch')?.addEventListener('change', (e) => {
      this.pitch = parseFloat(e.target.value);
      document.getElementById('tts-pitch-display').textContent = this.pitch.toFixed(1) + 'x';
    });

    this.textElements = textElements;
  }

  /**
   * สลับการอ่าน On/Off
   */
  toggleSpeak() {
    if (window.speechSynthesis.speaking) {
      this.stop();
    } else {
      this.speak();
    }
  }

  /**
   * เริ่มอ่าน
   */
  speak() {
    if (!this.isSupported) {
      alert('ระบบอ่านไทยไม่รองรับในบราวเซอร์นี้');
      return;
    }

    // รวมข้อความจากทุก element
    let fullText = '';
    if (this.textElements.length > 0) {
      this.textElements.forEach(id => {
        const el = document.getElementById(id);
        if (el) fullText += el.textContent + '. ';
      });
    } else {
      // ถ้าไม่ได้ระบุ elements ให้อ่านเนื้อหาของ body
      fullText = document.body.innerText;
    }

    if (!fullText.trim()) {
      console.warn('ไม่มีข้อความให้อ่าน');
      return;
    }

    this.utterance = new SpeechSynthesisUtterance(fullText);
    this.utterance.lang = this.lang;
    this.utterance.rate = this.rate;
    this.utterance.pitch = this.pitch;
    this.utterance.volume = this.volume;

    this.utterance.onstart = () => {
      this.isSpeak = true;
      const btn = document.getElementById('btn-tts-speak');
      if (btn) btn.textContent = '⏸️ หยุดอ่าน';
    };

    this.utterance.onend = () => {
      this.isSpeak = false;
      const btn = document.getElementById('btn-tts-speak');
      if (btn) btn.textContent = '🔊 อ่านหน้านี้';
    };

    this.utterance.onerror = (e) => {
      console.error('TTS Error:', e.error);
      this.isSpeak = false;
      const btn = document.getElementById('btn-tts-speak');
      if (btn) btn.textContent = '🔊 อ่านหน้านี้';

      // Handle specific errors
      if (e.error === 'not-allowed' || e.error === 'network') {
        alert('❌ ระบบอ่านไทยยังไม่พร้อม\n\nแนะนำ:\n1. ใช้ Google Chrome ล่าสุด\n2. ตรวจสอบการเชื่อมต่อ Internet\n3. ให้สิทธิ์การอ่านไทย (อาจต้องอัปเดตเสียง)');
      } else if (e.error === 'synthesis-unavailable') {
        alert('⚠️ ระบบเสียงไทยไม่พร้อมใช้งาน');
      }
    };

    window.speechSynthesis.speak(this.utterance);
  }

  /**
   * หยุดอ่าน
   */
  stop() {
    window.speechSynthesis.cancel();
    this.isSpeak = false;
    const btn = document.getElementById('btn-tts-speak');
    if (btn) btn.textContent = '🔊 อ่านหน้านี้';
  }

  /**
   * อ่าน element เดียว
   * @param {string} elementId - ID ของ element ที่จะอ่าน
   */
  speakElement(elementId) {
    const el = document.getElementById(elementId);
    if (!el) {
      console.warn(`Element with id "${elementId}" not found`);
      return;
    }

    const text = el.innerText || el.textContent;
    this.utterance = new SpeechSynthesisUtterance(text);
    this.utterance.lang = this.lang;
    this.utterance.rate = this.rate;
    this.utterance.pitch = this.pitch;

    window.speechSynthesis.speak(this.utterance);
  }

  /**
   * อ่านข้อความตรง ๆ
   * @param {string} text - ข้อความที่จะอ่าน
   */
  speakText(text) {
    this.utterance = new SpeechSynthesisUtterance(text);
    this.utterance.lang = this.lang;
    this.utterance.rate = this.rate;
    this.utterance.pitch = this.pitch;

    this.utterance.onstart = () => {
      this.isSpeak = true;
    };

    this.utterance.onend = () => {
      this.isSpeak = false;
    };

    window.speechSynthesis.speak(this.utterance);
  }
}

// Global instance
const thaiTTS = new ThaiTTSHelper();

// ⚠️ ข้อมูลสำคัญ:
// - ระบบอ่านเสริมเท่านั้น ไม่ใช่การเรียนวิธีการอ่านภาษาไทย
// - ความแม่นยำของการออกเสียงขึ้นอยู่กับระบบปฏิบัติการและเบราวเซอร์
// - แนะนำให้ใช้ Google Chrome เวอร์ชันล่าสุดเพื่อความเข้ากันได้ที่ดี
