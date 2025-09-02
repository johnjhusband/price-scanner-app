// QR Code generator for canvas
// Uses a simple QR code algorithm suitable for URLs

const QRCodeGenerator = {
  // Generate QR code data matrix
  generateMatrix: (text) => {
    // For MVP, we'll use a simple pattern that represents the URL
    // In production, you'd use a proper QR library
    const size = 25; // Standard QR size
    const matrix = Array(size).fill(null).map(() => Array(size).fill(false));
    
    // Add finder patterns (the three corner squares)
    const addFinderPattern = (row, col) => {
      for (let r = 0; r < 7; r++) {
        for (let c = 0; c < 7; c++) {
          if (r === 0 || r === 6 || c === 0 || c === 6 ||
              (r >= 2 && r <= 4 && c >= 2 && c <= 4)) {
            if (row + r < size && col + c < size) {
              matrix[row + r][col + c] = true;
            }
          }
        }
      }
    };
    
    // Add three finder patterns
    addFinderPattern(0, 0);
    addFinderPattern(0, size - 7);
    addFinderPattern(size - 7, 0);
    
    // Add timing patterns
    for (let i = 8; i < size - 8; i++) {
      matrix[6][i] = i % 2 === 0;
      matrix[i][6] = i % 2 === 0;
    }
    
    // Encode data (simplified - just creates a pattern based on text)
    let dataIndex = 0;
    for (let row = 9; row < size - 8; row++) {
      for (let col = 9; col < size - 8; col++) {
        if (dataIndex < text.length) {
          matrix[row][col] = text.charCodeAt(dataIndex) % 2 === 0;
          dataIndex++;
        } else {
          matrix[row][col] = (row + col) % 2 === 0;
        }
      }
    }
    
    return matrix;
  },

  // Draw QR code on canvas
  drawQRCode: (ctx, text, x, y, size, color = '#000000') => {
    const matrix = QRCodeGenerator.generateMatrix(text);
    const moduleSize = size / matrix.length;
    
    ctx.fillStyle = color;
    
    for (let row = 0; row < matrix.length; row++) {
      for (let col = 0; col < matrix.length; col++) {
        if (matrix[row][col]) {
          ctx.fillRect(
            x + col * moduleSize,
            y + row * moduleSize,
            moduleSize,
            moduleSize
          );
        }
      }
    }
    
    // Add white border
    ctx.strokeStyle = '#FFFFFF';
    ctx.lineWidth = moduleSize;
    ctx.strokeRect(x - moduleSize, y - moduleSize, size + moduleSize * 2, size + moduleSize * 2);
  },

  // Generate QR code URL for backend service
  getQRCodeURL: (text) => {
    // Use our backend QR service
    const encodedText = encodeURIComponent(text);
    return `/api/qr/generate?text=${encodedText}&size=200`;
  }
};

export default QRCodeGenerator;