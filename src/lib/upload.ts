// 客戶端圖片壓縮 + 上傳

const MAX_SIZE = 3.5 * 1024 * 1024; // 壓縮目標 3.5MB（留 buffer 給 4MB 限制）
const MAX_DIMENSION = 2400; // 最大寬或高

function compressImage(file: File): Promise<File> {
  return new Promise((resolve, reject) => {
    // 如果已經夠小，直接回傳
    if (file.size <= MAX_SIZE) {
      resolve(file);
      return;
    }

    const img = new Image();
    const url = URL.createObjectURL(file);

    img.onload = () => {
      URL.revokeObjectURL(url);

      let { width, height } = img;

      // 等比縮小到最大尺寸內
      if (width > MAX_DIMENSION || height > MAX_DIMENSION) {
        const ratio = Math.min(MAX_DIMENSION / width, MAX_DIMENSION / height);
        width = Math.round(width * ratio);
        height = Math.round(height * ratio);
      }

      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext("2d")!;
      ctx.drawImage(img, 0, 0, width, height);

      // 用不同品質嘗試壓縮到目標大小
      const qualities = [0.85, 0.7, 0.5, 0.3];
      const type = "image/jpeg";

      function tryCompress(index: number) {
        const quality = qualities[index];
        canvas.toBlob(
          (blob) => {
            if (!blob) {
              reject(new Error("壓縮失敗"));
              return;
            }
            if (blob.size <= MAX_SIZE || index >= qualities.length - 1) {
              const compressed = new File([blob], file.name.replace(/\.\w+$/, ".jpg"), {
                type: "image/jpeg",
              });
              resolve(compressed);
            } else {
              tryCompress(index + 1);
            }
          },
          type,
          quality
        );
      }

      tryCompress(0);
    };

    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("無法讀取圖片"));
    };

    img.src = url;
  });
}

export async function uploadImage(file: File): Promise<string> {
  const compressed = await compressImage(file);

  const formData = new FormData();
  formData.append("file", compressed);

  const res = await fetch("/api/upload", {
    method: "POST",
    body: formData,
  });
  const data = await res.json();

  if (!res.ok) {
    throw new Error(data.error || "上傳失敗");
  }

  return data.url;
}
