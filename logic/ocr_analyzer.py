"""
ocr_analyzer.py — 상세 이미지 OCR 텍스트 추출

crawler.py가 캡처한 상세 이미지에서 텍스트를 추출합니다.
추출된 텍스트는 Gemini 정제 → AI 워싱 클레임 분석에 사용됩니다.

주요 처리:
- 한글 경로 지원: numpy로 파일 읽기 후 OpenCV 디코딩
- 흑백 변환으로 OCR 정확도 향상
- 2000px 단위 청크 분할 스캔으로 메모리 효율 확보
- GPU 사용 가능 시 EasyOCR을 GPU 모드로 초기화하고, 불가능하면 CPU로 자동 fallback
"""

import os

import cv2
import easyocr
import numpy as np


# =====================================================================
# OCR 디바이스 자동 선택
# =====================================================================
def _is_cuda_available():
    """
    현재 환경에서 PyTorch CUDA 사용 가능 여부를 확인한다.

    EasyOCR은 내부적으로 PyTorch를 사용하므로,
    torch.cuda.is_available()이 True일 때 GPU 모드로 초기화한다.
    torch import 또는 CUDA 확인 과정에서 문제가 생기면 안전하게 CPU로 fallback한다.
    """
    try:
        import torch
        return torch.cuda.is_available()
    except Exception:
        return False


def _create_easyocr_reader():
    """
    EasyOCR Reader를 한 번만 초기화한다.

    - GPU 사용 가능: gpu=True
    - GPU 사용 불가: gpu=False
    - GPU 초기화 실패: CPU Reader로 재시도
    """
    use_gpu = _is_cuda_available()
    device_name = "GPU(CUDA)" if use_gpu else "CPU"

    try:
        print(f"[OCR] EasyOCR Reader 초기화 중... 사용 디바이스: {device_name}")
        return easyocr.Reader(['ko', 'en'], gpu=use_gpu), device_name
    except Exception as e:
        if use_gpu:
            print(f"[OCR] GPU 모드 초기화 실패: {e}")
            print("[OCR] CPU 모드로 재시도합니다.")
            return easyocr.Reader(['ko', 'en'], gpu=False), "CPU(fallback)"
        raise


# 모듈 로드 시 EasyOCR 리더를 한 번만 초기화 (한국어 + 영어)
reader, OCR_DEVICE = _create_easyocr_reader()


# =====================================================================
# OCR 분석 함수
# =====================================================================
def analyze_ai_washing(image_path):
    """
    이미지 파일에서 텍스트를 OCR로 추출하여 반환합니다.

    Args:
        image_path: 분석할 이미지 파일 경로

    Returns:
        {
            "extracted_text": str,
            "ocr_device": str
        }

        - extracted_text: 추출된 전체 텍스트
        - ocr_device: OCR 실행 디바이스 정보

        실패 또는 이미지가 없으면 extracted_text는 빈 문자열을 반환합니다.
    """
    if not image_path or not os.path.exists(image_path):
        return {
            "extracted_text": "",
            "ocr_device": OCR_DEVICE,
        }

    print(f" OCR 엔진 가동! (디바이스: {OCR_DEVICE}, 흑백 변환 + 청크 분할 스캔...)")

    try:
        # 한글 경로 지원: numpy로 읽어서 CV2로 디코딩
        img_array = np.fromfile(image_path, np.uint8)
        img = cv2.imdecode(img_array, cv2.IMREAD_COLOR)

        if img is None:
            print("❌ OCR 실패: 이미지를 OpenCV로 디코딩할 수 없습니다.")
            return {
                "extracted_text": "",
                "ocr_device": OCR_DEVICE,
            }

        gray_img = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
        height = gray_img.shape[0]
        chunk_size = 2000
        all_texts = []

        for y in range(0, height, chunk_size):
            chunk = gray_img[y:y + chunk_size, :]
            texts = reader.readtext(chunk, detail=0, paragraph=True)

            if texts:
                all_texts.extend(texts)

            current_y = min(y + chunk_size, height)
            print(f" 청크 스캔 중... ({y}px ~ {current_y}px) / 총 {height}px")

        return {
            "extracted_text": " ".join(all_texts),
            "ocr_device": OCR_DEVICE,
        }

    except Exception as e:
        print(f"❌ OCR 실패: {e}")
        return {
            "extracted_text": "",
            "ocr_device": OCR_DEVICE,
        }
