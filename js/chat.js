/**
 * AGRI CRAFT-AI - AgriBot Conversational Assistant
 * AI agricultural chat assistant supporting English and Tamil queries.
 * Provides instant agronomic guidance, scheme steps, loan details, and mandi price quotes.
 */

const AgriChat = {
  messages: [],
  currentLang: 'en',

  init(lang = 'en') {
    this.currentLang = lang;
    this.messages = [
      {
        sender: 'bot',
        text: lang === 'ta'
          ? 'வணக்கம்! நான் உங்கள் அக்ரி கிராஃப்ட் AI உதவியாளர் (AgriBot). உங்கள் மண், பயிர் நோய், அரசு திட்டங்கள் அல்லது இன்றைய சந்தை விலை பற்றி ஏதேனும் கேட்கலாம்.'
          : 'Hello! I am your AGRI CRAFT-AI assistant (AgriBot). You can ask me about suitable crops, plant diseases, 4% KCC loans, PM-KISAN subsidies, or today\'s mandi prices.'
      }
    ];
  },

  sendUserMessage(userText, onReply) {
    if (!userText || !userText.trim()) return;

    this.messages.push({ sender: 'user', text: userText });

    // AI Response generation with realistic slight delay
    setTimeout(() => {
      const reply = this.generateResponse(userText.trim());
      this.messages.push({ sender: 'bot', text: reply });
      if (onReply) onReply(reply);
    }, 450);
  },

  generateResponse(query) {
    const q = query.toLowerCase();
    const isTamil = this.currentLang === 'ta' || /[\u0B80-\u0BFF]/.test(query);

    // 1. Crop advice query
    if (q.includes('crop') || q.includes('plant') || q.includes('பயிர்') || q.includes('நடவு')) {
      if (isTamil) {
        return 'பயிர் பரிந்துரைக்கு: உங்கள் மண் வகை, பாசன நீர் ஆதாரம் மற்றும் தற்போதைய பருவத்தை தேர்வு செய்யுங்கள். உதாரணமாக, வண்டல் மண்ணில் வாய்க்கால் நீர் வசதி இருந்தால் நெல் அல்லது கரும்பு சிறந்த மகசூல் தரும். செம்மண் அல்லது குறைந்த நீருக்கு நிலக்கடலை மற்றும் ராகி சிறந்தது!';
      }
      return 'For the best crop recommendation, provide your soil type, water source, and current season. For example, with alluvial soil and canal/borewell water in Kharif/Rabi, Paddy (Rice) offers maximum MSP stability. In dry red soils, Groundnut or Finger Millet (Ragi) provides great profit with minimal water!';
    }

    // 2. Disease query
    if (q.includes('disease') || q.includes('blast') || q.includes('spot') || q.includes('curl') || q.includes('நோய்') || q.includes('கருகல்') || q.includes('இலை')) {
      if (isTamil) {
        return 'பயிர் நோய் ஏற்பட்டால் எங்களது "நோய் கண்டறிதல்" பிரிவில் இலை புகைப்படத்தை பதிவேற்றவும்! நெல் குலை நோய்க்கு சூடோமோனாஸ் (10g/L) அல்லது ட்ரைசைக்ளசோல் (0.6g/L) தெளிக்கவும். தக்காளி இலை கருகலுக்கு மேன்கோசெப் 2g/L தெளிக்கலாம்.';
      }
      return 'For accurate disease detection, use our "Disease Detection" tab to scan a leaf photo! For Rice Leaf Blast, spray Pseudomonas fluorescens (10g/L) or Tricyclazole (0.6g/L). For Tomato Early Blight, apply Mancozeb (2g/L) and avoid overhead watering.';
    }

    // 3. Loan / KCC query
    if (q.includes('loan') || q.includes('kcc') || q.includes('interest') || q.includes('கடன்') || q.includes('வட்டி')) {
      if (isTamil) {
        return 'விவசாயிகளுக்கு சிறந்த கடன் கிசான் கிரெடிட் கார்டு (KCC) ஆகும். இதன் வட்டி 7%, ஆனால் சரியான நேரத்தில் திரும்பச் செலுத்தினால் 3% அரசு மானியம் கிடைத்து, வெறும் 4% வட்டி மட்டுமே செலுத்த வேண்டி இருக்கும்! உங்கள் பட்டா/சிட்டா மற்றும் அடங்கல் நகலுடன் தொடக்க வேளாண் கூட்டுறவு வங்கி அல்லது தேசியமயமாக்கப்பட்ட வங்கியை அணுகவும்.';
      }
      return 'The most beneficial agricultural loan is the Kisan Credit Card (KCC). It carries a subsidized 7% interest rate with an additional 3% Prompt Repayment Incentive, effectively making it just 4.0% per annum! Collateral-free loans are available up to ₹1,60,000 with your land Patta/Chitta and sowing certificate.';
    }

    // 4. Government Scheme / PM-KISAN query
    if (q.includes('scheme') || q.includes('pm-kisan') || q.includes('pm kisan') || q.includes('subsidy') || q.includes('திட்டம்') || q.includes('மானிய')) {
      if (isTamil) {
        return 'முக்கிய அரசு திட்டங்கள்: 1) PM-KISAN: ஆண்டுக்கு ₹6,000 நேரடி வங்கி வரவு. 2) PMKSY: சிறு/குறு விவசாயிகளுக்கு சொட்டு நீர் பாசனத்திற்கு 100% மானியம். 3) கலைஞரின் ஒருங்கிணைந்த வேளாண் திட்டம்: காய்கறி விதை தொகுப்பு மற்றும் மரக்கன்றுகள். pmkisan.gov.in அல்லது உழவன் செயலியில் விண்ணப்பிக்கலாம்.';
      }
      return 'Top Government Schemes for farmers: 1) PM-KISAN: Direct income support of ₹6,000/year in 3 equal installments. 2) PMKSY Drip Subsidy: 100% subsidy for Small & Marginal farmers in Tamil Nadu. 3) SMAM: 40-50% subsidy on farm machinery. Apply via official portals like pmkisan.gov.in or Uzhavan Mobile App.';
    }

    // 5. Market / Price query
    if (q.includes('price') || q.includes('mandi') || q.includes('market') || q.includes('விலை') || q.includes('சந்தை')) {
      if (isTamil) {
        return 'இன்றைய முக்கிய விலை நிலவரம் (e-NAM): தஞ்சாவூர் நெல்: ₹2,320/குவிண்டால் (+1.7%). ஈரோடு விரலி மஞ்சள்: ₹16,800/குவிண்டால். மதுரை தக்காளி: ₹2,600/குவிண்டால் (உயர்வு). எங்கள் "சந்தை நிலவரம்" பக்கத்தில் முழு 7 நாள் வரைபடத்தை காணலாம்!';
      }
      return 'Today\'s Mandi Highlights (e-NAM Sync): Paddy in Thanjavur is ₹2,320/Qtl (+1.75%), Turmeric in Erode is trading high at ₹16,800/Qtl (+2.44%), and Tomato in Madurai is ₹2,600/Qtl. View the 7-day interactive price charts in the "Market Prices" tab!';
    }

    // 6. Helpline query
    if (q.includes('help') || q.includes('call') || q.includes('number') || q.includes('உதவி') || q.includes('போன்')) {
      if (isTamil) {
        return 'அவசர உதவிக்கு கிசான் அழைப்பு மையத்தின் இலவச எண்ணை அழைக்கவும்: 1800-180-1551 (காலை 6 மணி முதல் இரவு 10 மணி வரை அனைத்து நாட்களும் தமிழில் பேசலாம்). பயிர் காப்பீட்டுக்கு 14447.';
      }
      return 'For immediate agricultural helpline support, dial the Kisan Call Center toll-free at 1800-180-1551 (6:00 AM to 10:00 PM in all languages including Tamil). For Crop Insurance (PMFBY), dial 14447.';
    }

    // Default polite response
    if (isTamil) {
      return 'நான் உங்களுக்கு உதவ தயாராக உள்ளேன். நீங்கள் பயிர் பரிந்துரை, இலை நோய் சிகிச்சை, 4% KCC கடன், அரசு மானியங்கள் அல்லது சந்தை விலை பற்றி கேட்கலாம்!';
    }
    return 'I am ready to help! You can ask me about AI crop recommendations, treating plant leaf diseases, applying for 4% KCC loans, government subsidies (PM-KISAN / PMKSY), or current mandi rates.';
  }
};

if (typeof window !== 'undefined') {
  window.AgriChat = AgriChat;
}
