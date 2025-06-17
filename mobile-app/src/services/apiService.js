const API_BASE_URL = 'http://localhost:8000';

export const analyzeImage = async (imageUri) => {
  try {
    // Create form data for image upload
    const formData = new FormData();
    formData.append('image', {
      uri: imageUri,
      type: 'image/jpeg',
      name: 'item.jpg',
    });

    const response = await fetch(`${API_BASE_URL}/api/scan`, {
      method: 'POST',
      body: formData,
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error analyzing image:', error);
    throw error;
  }
};

export const checkServerHealth = async () => {
  try {
    const response = await fetch(`${API_BASE_URL}/health`);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    return await response.json();
  } catch (error) {
    console.error('Error checking server health:', error);
    throw error;
  }
};

export const checkScanServiceHealth = async () => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/scan/health`);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    return await response.json();
  } catch (error) {
    console.error('Error checking scan service health:', error);
    throw error;
  }
}; 