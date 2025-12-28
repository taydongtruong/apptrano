import { Haptics, ImpactStyle } from '@capacitor/haptics';
import { TextToSpeech } from '@capacitor-community/text-to-speech';

const isMobile = window.Capacitor !== undefined;

// Đảm bảo có từ khóa export ở đây
export const playMobileEffect = async (text) => {
  if (isMobile) {
    try {
      // 1. Rung điện thoại
      await Haptics.impact({ style: ImpactStyle.Medium });

      // 2. Phát âm thanh lời nói
      await TextToSpeech.speak({
        text: text,
        lang: 'vi-VN',
        rate: 1.0,
      });
    } catch (e) {
      console.error("Mobile Effect Error:", e);
    }
  } else {
    // Nếu chạy trên Web máy tính thì chỉ in ra log để tránh lỗi
    console.log("Hiệu ứng Mobile (Web mode):", text);
  }
};