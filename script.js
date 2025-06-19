function validateCell(cell, columnIndex) {
  const text = cell.textContent.trim();
  let isValid = true;
  const columnValidations = [
    // Col 0: Código: Alphanumeric, Max 50 chars
    { regex: /^[a-zA-Z0-9]*$/, maxLength: 50 },
    // Col 1: Descripcion: Alphanumeric, Max 100 chars
    { regex: /^[a-zA-Z0-9\s]*$/, maxLength: 100 }, // Added \s for spaces
    // Col 2: Forma de pago: "CTA" or "TAR"
    { options: ["CTA", "TAR"] },
    // Col 3: Tipo de cuenta/tarjeta: Conditional validation
    { conditional: true },
    // Col 4: Numero de cuenta/Tarjeta: Alphanumeric, Max 20
    { regex: /^[a-zA-Z0-9]*$/, maxLength: 20 },
    // Col 5: Monto máximo: Numeric
    { numeric: true },
    // Col 6: Email: Specific format, allowed chars, Max 100
    { regex: /^[^\s@]+@[^\s@]+\.[^\s@]+$/, maxLength: 100, allowedCharsRegex: /^[a-zA-Z0-9@._\-]*$/ },
    // Col 7: Teléfono: Numeric, Max 9
    { regex: /^[0-9]*$/, maxLength: 9 }
  ];

  const validation = columnValidations[columnIndex];
  cell.classList.remove('invalid-cell'); // Reset style first

  if (columnIndex === 3 && validation && validation.conditional) {
    const formaDePagoCell = cell.parentElement.cells[2]; // Get 'Forma de pago' cell
    const formaDePagoValue = formaDePagoCell ? formaDePagoCell.textContent.trim().toUpperCase() : "";
    let allowedTypes = [];
    let typeIsValid = false;

    if (formaDePagoValue === "CTA") {
      allowedTypes = ["CTE", "AHO"];
    } else if (formaDePagoValue === "TAR") {
      allowedTypes = ["A", "V", "M"];
    }

    if (text.length === 0) { // Empty is considered valid for this field
      typeIsValid = true;
    } else if (allowedTypes.length > 0 && allowedTypes.includes(text.toUpperCase())) {
      typeIsValid = true;
      cell.textContent = text.toUpperCase(); // Normalize to uppercase if valid
    } else if (allowedTypes.length === 0 && text.length > 0) {
      // Forma de pago is not CTA/TAR (or empty/invalid), so any text here is invalid
      typeIsValid = false;
    } else if (allowedTypes.length > 0 && !allowedTypes.includes(text.toUpperCase())) {
      // Forma de pago IS CTA/TAR, but text is not in the allowed list for it
      typeIsValid = false;
    } else {
      // Default case: forma de pago is something else and text is empty (already handled by text.length === 0)
      // or forma de pago is cta/tar and text is empty (also handled)
      typeIsValid = text.length === 0;
    }

    isValid = typeIsValid;

    if (!isValid) {
      cell.classList.add('invalid-cell');
    }
    // cell.classList.remove is handled by the initial call at the function start
    return isValid; // Return early for conditional logic of column 3
  }

  if (!validation) {
    return true; // No validation for this column
  }

  if (validation.maxLength && text.length > validation.maxLength) {
    isValid = false;
  }

  // New check for allowed characters if the property exists
  if (validation.allowedCharsRegex && !validation.allowedCharsRegex.test(text)) {
    isValid = false;
  }

  // Original regex check (for structure, like email format, or specific options)
  if (validation.regex && !validation.regex.test(text)) {
    isValid = false;
  }

  // Allow empty values for regex/maxLength/allowedCharsRegex checks unless specifically disallowed
  // Allow empty values for regex/maxLength/allowedCharsRegex checks unless specifically disallowed
  // For example, an empty string is valid for alphanumeric or email unless a "required" flag is added
  if (text.length === 0 && (validation.regex || validation.maxLength || validation.allowedCharsRegex)) {
      // If field is empty, and it's not 'Forma de pago' or 'Monto Máximo' which might be mandatory
      // or have specific non-empty rules. For now, allow empty for these fields.
      // This means an empty "Código", "Descripcion", "Email", "Numero de cuenta/Tarjeta", "Teléfono" is valid.
      // If they were mandatory, we'd need another flag e.g. { required: true }
      isValid = true;
  }

  // This block should not run for column 3 due to early return.
  if (validation.options) {
    if (!validation.options.includes(text.toUpperCase())) {
      isValid = false;
    } else {
      // Normalize to uppercase if valid (for CTA/TAR)
      cell.textContent = text.toUpperCase();
    }
  }

  // This block should not run for column 3 due to early return.
  if (validation.numeric) {
    // Basic numeric check, allows for decimals.
    // Allows empty string, as it's not explicitly "required".
    // Use !isNaN(parseFloat(text)) for basic check if not empty, and isFinite for actual numbers
    if (text !== "" && (isNaN(parseFloat(text)) || !isFinite(text))) {
      isValid = false;
    }
  }

  // Specific handling for empty required fields:
  // Forma de pago (column 2) and Monto máximo (column 5) might be implicitly required if not empty.
  // For now, the logic above allows empty for most fields. If "Forma de pago" must not be empty:
  if (columnIndex === 2 && text.length === 0) {
      // This makes "Forma de pago" not mandatory. If it were, set isValid = false.
      // Let's assume for now it's not strictly mandatory if empty.
  }
  // If "Monto máximo" must not be empty:
  if (columnIndex === 5 && text.length === 0) {
      // Let's assume for now it's not strictly mandatory if empty.
  }

  // Final class application for non-column 3 validations
  if (!isValid) {
    cell.classList.add('invalid-cell');
  }
  // If isValid is true, the initial cell.classList.remove('invalid-cell') has already cleaned it.
  return isValid;
}

document.addEventListener('DOMContentLoaded', () => {
  const addRowBtn = document.getElementById('addRowBtn');
  const exportBtn = document.getElementById('exportBtn');
  const dataTable = document.getElementById('dataTable').getElementsByTagName('tbody')[0];

  // Function to create and append a new row
  function createAndAppendNewRow() {
    const newRow = dataTable.insertRow();
    for (let i = 0; i < 8; i++) {
      const newCell = newRow.insertCell();
      newCell.contentEditable = 'true';
      const cellIndex = i; // Capture i for the closure
      newCell.addEventListener('blur', (event) => {
        validateCell(event.target, cellIndex);
        if (cellIndex === 2) { // If 'Forma de pago' cell (index 2) lost focus
          const tipoCuentaCell = event.target.parentElement.cells[3]; // Get 'Tipo de cuenta/tarjeta' cell (index 3)
          if (tipoCuentaCell) {
            validateCell(tipoCuentaCell, 3); // Re-validate it
          }
        }
      });
    }
    return newRow; // Return the new row
  }

  // Add new row to the table
  addRowBtn.addEventListener('click', createAndAppendNewRow);

  // Add blur listeners to initial row cells
  const initialRow = dataTable.rows[0];
  if (initialRow) {
    for (let i = 0; i < initialRow.cells.length; i++) {
      const cell = initialRow.cells[i];
      if (cell.contentEditable === 'true') {
        const cellIndex = i;
        cell.addEventListener('blur', (event) => {
          validateCell(event.target, cellIndex);
          if (cellIndex === 2) { // If 'Forma de pago' cell (index 2) lost focus
            const tipoCuentaCell = event.target.parentElement.cells[3]; // Get 'Tipo de cuenta/tarjeta' cell (index 3)
            if (tipoCuentaCell) {
              validateCell(tipoCuentaCell, 3); // Re-validate it
            }
          }
        });
      }
    }
  }

  // Export table data to TXT file
  exportBtn.addEventListener('click', () => {
    let content = '';
    const rows = dataTable.rows;
    for (let i = 0; i < rows.length; i++) {
      const cells = rows[i].cells; // These are the TD elements
      const rowData = [];
      for (let j = 0; j < cells.length; j++) {
        let cellValue = cells[j].textContent.trim(); // Use textContent and trim

        if (j === 5) { // "Monto máximo" column
          const numericValue = parseFloat(cellValue);
          if (!isNaN(numericValue) && isFinite(numericValue)) {
            cellValue = (numericValue * 100).toString();
          } else {
            cellValue = "999999"; // Default value if empty or not a valid number
          }
        }
        rowData.push(cellValue);
      }
      content += rowData.join(';') + '\n'; // Use semicolon as a delimiter
    }

    const blob = new Blob([content], { type: 'text/plain' });
    const anchor = document.createElement('a');
    anchor.download = 'export.txt';
    anchor.href = window.URL.createObjectURL(blob);
    anchor.style.display = 'none'; // Make the anchor invisible
    document.body.appendChild(anchor);
    anchor.click();
    document.body.removeChild(anchor);
    window.URL.revokeObjectURL(anchor.href); // Clean up
  });

  // Paste from Excel functionality
  dataTable.addEventListener('paste', (event) => {
    event.preventDefault();
    const clipboardData = event.clipboardData || window.clipboardData;
    const pastedText = clipboardData.getData('text/plain');
    const rowStrings = pastedText.split('\n');

    // Remove last empty row if present (due to trailing newline)
    if (rowStrings.length > 1 && rowStrings[rowStrings.length - 1] === '') {
      rowStrings.pop();
    }

    let targetCell = event.target;
    if (targetCell.nodeName !== 'TD') {
      targetCell = targetCell.closest('td');
    }
    if (!targetCell) return; // Should not happen if paste is within tbody

    let targetRow = targetCell.closest('tr');
    let initialTargetCellIndex = Array.from(targetRow.cells).indexOf(targetCell);

    rowStrings.forEach((rowString, rowIndex) => {
      const cellValues = rowString.split('\t');
      let currentRow;
      let currentTargetCellIndex;

      if (rowIndex === 0) {
        currentRow = targetRow;
        currentTargetCellIndex = initialTargetCellIndex;
      } else {
        currentRow = createAndAppendNewRow(); // This will now add rows with blur listeners
        currentTargetCellIndex = 0; // Start from the first cell for new rows
      }

      cellValues.forEach((cellValue, colIndex) => {
        const finalCellIndex = currentTargetCellIndex + colIndex;
        if (finalCellIndex < currentRow.cells.length) {
          const cellToPopulate = currentRow.cells[finalCellIndex];
          cellToPopulate.textContent = cellValue;
          // Validate after populating from paste
          validateCell(cellToPopulate, finalCellIndex);
        }
      });
    });
  });
});
