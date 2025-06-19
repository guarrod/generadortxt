function validateCell(cell, columnIndex) {
  const text = cell.textContent.trim();
  let isValid = true;
  const columnValidations = [
    // Col 0: Código: Alphanumeric, Max 50 chars, Required
    { regex: /^[a-zA-Z0-9]*$/, maxLength: 50, required: true },
    // Col 1: Descripcion: Alphanumeric, Max 100 chars, Required
    { regex: /^[a-zA-Z0-9\s]*$/, maxLength: 100, required: true }, // Added \s for spaces
    // Col 2: Forma de pago: "CTA" or "TAR", Required
    { options: ["CTA", "TAR"], required: true },
    // Col 3: Tipo de cuenta/tarjeta: Conditional validation, Required
    { conditional: true, required: true },
    // Col 4: Numero de cuenta/Tarjeta: Alphanumeric, Max 20, Required
    { regex: /^[a-zA-Z0-9]*$/, maxLength: 20, required: true },
    // Col 5: Monto máximo: Numeric (Not required for now based on problem description)
    { numeric: true },
    // Col 6: Email: Specific format, allowed chars, Max 100 (Not required for now)
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
    // isValid is initialized to true at the start of the function.
    // For column 3, we manage 'isValid' directly.

    if (validation.required && text.length === 0) {
      isValid = false;
    } else if (text.length === 0 && !validation.required) { // Not required and empty
      isValid = true; // This path won't be taken if required:true as per current subtask
    } else {
      // Field is not empty, or it's empty but not required (latter won't happen for col 3 now)
      // Proceed with CTA/TAR logic
      if (formaDePagoValue === "CTA") {
        allowedTypes = ["CTE", "AHO"];
      } else if (formaDePagoValue === "TAR") {
        allowedTypes = ["A", "V", "M"];
      }

      if (allowedTypes.length > 0 && allowedTypes.includes(text.toUpperCase())) {
        isValid = true;
        cell.textContent = text.toUpperCase(); // Normalize to uppercase if valid
      } else if (allowedTypes.length === 0 && text.length > 0) {
        // Forma de pago is not CTA/TAR (or empty/invalid), so any non-empty text here is invalid
        isValid = false;
      } else if (allowedTypes.length > 0 && !allowedTypes.includes(text.toUpperCase())) {
        // Forma de pago IS CTA/TAR, but text is not in the allowed list for it
        isValid = false;
      } else if (allowedTypes.length === 0 && text.length === 0 && validation.required) {
        // This case means Forma de pago is not set, cell is empty, and it's required
        isValid = false;
      } else if (allowedTypes.length === 0 && text.length === 0 && !validation.required){
        // Forma de pago not set, cell is empty, and not required
        isValid = true;
      }
       // If text.length > 0 and allowedTypes is empty (meaning formaDePagoValue is not CTA/TAR), it's invalid.
       // If text.length === 0, it's handled by required check.
    }

    if (!isValid) {
      cell.classList.add('invalid-cell');
    }
    return isValid; // Return early for conditional logic of column 3
  }

  if (!validation) {
    return true; // No validation for this column (already handled if !validation at start)
  }

  // Standard validation checks - proceed if isValid is still true
  if (isValid && validation.maxLength && text.length > validation.maxLength) {
    isValid = false;
  }

  if (isValid && validation.allowedCharsRegex && !validation.allowedCharsRegex.test(text)) {
    isValid = false;
  }

  if (isValid && validation.regex && !validation.regex.test(text)) {
    isValid = false;
  }

  if (isValid && validation.options) {
    if (!validation.options.includes(text.toUpperCase())) {
      isValid = false;
    } else {
      cell.textContent = text.toUpperCase(); // Normalize
    }
  }

  if (isValid && validation.numeric) {
    if (text !== "" && (isNaN(parseFloat(text)) || !isFinite(text))) {
      isValid = false;
    }
    // Note: if numeric is also required, empty string "" will be caught by the 'required' check below.
    // If numeric is NOT required, empty string "" is currently valid for numeric.
  }

  // General 'required' check: if the field is required and empty, it's invalid.
  // This catches cases where an empty string might pass other rules (e.g., regex with '*')
  // but is not allowed due to being required.
  if (validation.required && text.length === 0) {
    isValid = false;
  }

  if (!isValid) {
    cell.classList.add('invalid-cell');
  }
  return isValid;
}

function checkRowIsEmpty(rowElement) {
  if (!rowElement) {
    return false; // Or handle error appropriately
  }
  const cells = rowElement.getElementsByTagName('td');
  for (let i = 0; i < cells.length; i++) {
    if (cells[i].textContent.trim() !== "") {
      return false; // Row is not empty
    }
  }
  return true; // All cells are empty
}

function handleRowRemoval(rowElement) {
  if (!rowElement) {
    return;
  }
  if (checkRowIsEmpty(rowElement)) {
    rowElement.remove();
  }
}

function checkAndRemoveAllEmptyRows() {
  const rows = dataTable.rows; // dataTable is the tbody, defined in DOMContentLoaded
  for (let i = rows.length - 1; i >= 0; i--) {
    // Iterating backwards is safer when removing elements from a live HTMLCollection
    handleRowRemoval(rows[i]);
  }
}

document.addEventListener('DOMContentLoaded', () => {
  const addRowBtn = document.getElementById('addRowBtn');
  const exportBtn = document.getElementById('exportBtn');
  // Define dataTable here so it's in scope for checkAndRemoveAllEmptyRows
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
        const parentRow = event.target.closest('tr');
        if (parentRow) {
          handleRowRemoval(parentRow);
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
        const parentRow = event.target.closest('tr');
        if (parentRow) {
          handleRowRemoval(parentRow);
        }
        });
      }
    }
  }

  // Export table data to TXT file
  exportBtn.addEventListener('click', () => {
    const mandatoryColumnIndices = [0, 1, 2, 3, 4];
    const rows = dataTable.rows; // dataTable is the tbody

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      for (const columnIndex of mandatoryColumnIndices) {
        const cell = row.cells[columnIndex];
        if (cell && cell.textContent.trim() === "") {
          alert("Error: Todas las filas deben tener completos los campos: Código, Descripcion, Forma de pago, Tipo de cuenta/tarjeta y Numero de cuenta/Tarjeta para poder exportar.");
          validateCell(cell, columnIndex); // Ensure the cell is styled as invalid
          return; // Prevent export
        }
      }
    }

    // If all mandatory fields are filled, proceed with export
    let content = '';
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
    checkAndRemoveAllEmptyRows(); // Call after paste processing is complete
  });
});
