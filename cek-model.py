import google.generativeai as genai

# Masukkan API Key kamu yang baru di sini
genai.configure(api_key="AIzaSyCBbyjq7C6w400FMUOmp89UH9YG-1nazbw")

print("Mencari daftar model gratis yang tersedia untuk akunmu...")
print("-" * 50)

try:
    for m in genai.list_models():
        if 'generateContent' in m.supported_generation_methods:
            print(f"- {m.name}")
    print("-" * 50)
    print("Selesai! Silakan pilih salah satu nama di atas.")
except Exception as e:
    print(f"Ups, gagal mengambil data: {e}")