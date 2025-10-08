/**
 * Generate a random password with 5 letters and 3 numbers
 * @returns {string} 8-character password (5 letters + 3 numbers)
 */
export function generatePassword() {
  const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz';
  const numbers = '0123456789';
  
  let password = '';
  
  // Generate 5 random letters
  for (let i = 0; i < 5; i++) {
    password += letters.charAt(Math.floor(Math.random() * letters.length));
  }
  
  // Generate 3 random numbers
  for (let i = 0; i < 3; i++) {
    password += numbers.charAt(Math.floor(Math.random() * numbers.length));
  }
  
  // Shuffle the password to mix letters and numbers
  return password.split('').sort(() => Math.random() - 0.5).join('');
}

/**
 * Generate a more readable password with alternating letters and numbers
 * @returns {string} 8-character password (pattern: LNLNLNLN or similar)
 */
export function generateReadablePassword() {
  const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz';
  const numbers = '0123456789';
  
  let password = '';
  const positions = [0, 1, 2, 3, 4, 5, 6, 7];
  
  // Randomly choose 5 positions for letters
  const letterPositions = positions.sort(() => Math.random() - 0.5).slice(0, 5);
  const numberPositions = positions.filter(pos => !letterPositions.includes(pos));
  
  // Create password array
  const passwordArray = new Array(8);
  
  // Fill letter positions
  letterPositions.forEach(pos => {
    passwordArray[pos] = letters.charAt(Math.floor(Math.random() * letters.length));
  });
  
  // Fill number positions
  numberPositions.forEach(pos => {
    passwordArray[pos] = numbers.charAt(Math.floor(Math.random() * numbers.length));
  });
  
  return passwordArray.join('');
}

/**
 * Validate if password meets requirements (5 letters, 3 numbers)
 * @param {string} password 
 * @returns {boolean}
 */
export function validatePasswordFormat(password) {
  if (!password || password.length !== 8) return false;
  
  const letterCount = (password.match(/[a-zA-Z]/g) || []).length;
  const numberCount = (password.match(/[0-9]/g) || []).length;
  
  return letterCount === 5 && numberCount === 3;
}