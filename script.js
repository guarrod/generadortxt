let dataTable; // Declare dataTable globally
let validations = [];

function validateField(value, index, row) {
  const text = value.trim();
  const columnValidations = [
    // Col 0: Código: Alphanumeric, Max 50 chars, Required
    { regex: /^[a-zA-Z0-9]*$/, maxLength: 50, required: true, message: "Código: Alfanumérico, máximo 50 caracteres." },
    // Col 1: Descripcion: Alphanumeric, Max 100 chars, Required
    { regex: /^[a-zA-Z0-9\s]*$/, maxLength: 100, required: true, message: "Descripción: Alfanumérico, máximo 100 caracteres." },
    // Col 2: Forma de pago: "CTA" or "TAR", Required
    { options: ["CTA", "TAR"], required: true, message: "Forma de pago: CTA o TAR." },
    // Col 3: Tipo de cuenta/tarjeta: Conditional validation, Required
    { conditional: true, required: true, message: "Tipo de cuenta/tarjeta: A, V, M para TAR; CTE, AHO para CTA." },
    // Col 4: Numero de cuenta/Tarjeta: Alphanumeric, Max 20, Required
    { regex: /^[a-zA-Z0-9]*$/, maxLength: 20, required: true, message: "Número de cuenta/Tarjeta: Alfanumérico, máximo 20 caracteres." },
    // Col 5: Monto máximo: Numeric (Not required for now based on problem description)
    { numeric: true, message: "Monto máximo: Numérico." },
    // Col 6: Email: Specific format, allowed chars, Max 100 (Not required for now)
    { regex: /^[^\s@]+@[^\s@]+\.[^\s@]+$/, maxLength: 100, allowedCharsRegex: /^[a-zA-Z0-9@._\-]*$/, message: "Email: Formato de email inválido." },
    // Col 7: Teléfono: Numeric, Max 10
    { regex: /^[0-9]*$/, maxLength: 10, message: "Teléfono: 10 dígitos numéricos." }
  ];

  const validation = columnValidations[index];

  if (validation.required && text.length === 0) {
    return { isValid: false, message: `Fila ${row + 1}, Columna ${index + 1}: Campo requerido.` };
  }

  if (validation.maxLength && text.length > validation.maxLength) {
    return { isValid: false, message: `Fila ${row + 1}, Columna ${index + 1}: ${validation.message}` };
  }

  if (validation.regex && !validation.regex.test(text)) {
    return { isValid: false, message: `Fila ${row + 1}, Columna ${index + 1}: ${validation.message}` };
  }

  if (validation.options && !validation.options.includes(text.toUpperCase())) {
    return { isValid: false, message: `Fila ${row + 1}, Columna ${index + 1}: ${validation.message}` };
  }

  if (validation.numeric && text !== "" && (isNaN(parseFloat(text)) || !isFinite(text))) {
    return { isValid: false, message: `Fila ${row + 1}, Columna ${index + 1}: ${validation.message}` };
  }

  if (index === 3 && validation.conditional) {
    const formaDePagoCell = document.getElementById('dataTable').rows[row].cells[2];
    const formaDePagoValue = formaDePagoCell ? formaDePagoCell.textContent.trim().toUpperCase() : "";
    let allowedTypes = [];
    if (formaDePagoValue === "CTA") {
      allowedTypes = ["CTE", "AHO"];
    } else if (formaDePagoValue === "TAR") {
      allowedTypes = ["A", "V", "M"];
    }
    if (allowedTypes.length > 0 && !allowedTypes.includes(text.toUpperCase())) {
      return { isValid: false, message: `Fila ${row + 1}, Columna ${index + 1}: ${validation.message}` };
    }
  }

  return { isValid: true, message: "" };
}

function displayValidationErrors() {
  const validationList = document.querySelector('.validations ul');
  const validationsContainer = document.querySelector('.validations');
  validationList.innerHTML = '';
  const validationKeys = Object.keys(validations);

  if (validationKeys.length > 0) {
    validationsContainer.classList.add('active');
    validationKeys.forEach(key => {
      const message = validations[key];
      const listItem = document.createElement('li');
      listItem.textContent = message;
      validationList.appendChild(listItem);
    });
  } else {
    validationsContainer.classList.remove('active');
  }
}

function validateCell(cell, columnIndex) {
  const text = cell.textContent.trim();
  const rowIndex = cell.parentElement.rowIndex - 1;
  const validationResult = validateField(text, columnIndex, rowIndex);

  const key = `row-${rowIndex}-col-${columnIndex}`;
  if (!validationResult.isValid) {
    cell.classList.add('invalid-cell');
    validations[key] = validationResult.message;
  } else {
    cell.classList.remove('invalid-cell');
    delete validations[key];
  }
  displayValidationErrors();
  return validationResult.isValid;
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
    // Only remove the row if it's empty AND it's not the last remaining row.
    // dataTable should now be the globally accessible tbody element.
    if (dataTable && dataTable.rows && dataTable.rows.length > 1) {
      rowElement.remove();
    }
    // If it's the last row and empty (dataTable.rows.length <= 1), it will not be removed.
  }
}

function checkAndRemoveAllEmptyRows() {
  const rows = dataTable.rows; // dataTable is the tbody, defined in DOMContentLoaded
  for (let i = rows.length - 1; i >= 0; i--) {
    // Iterating backwards is safer when removing elements from a live HTMLCollection
    handleRowRemoval(rows[i]);
  }
}

function displayNotification(message, type = 'error') {
  const notificationDiv = document.getElementById('notificationArea');
  if (notificationDiv) {
    notificationDiv.textContent = message;
    notificationDiv.className = `notification ${type}`;
  }

  // Also update the info-box for phone errors
  if (message.includes("Teléfono")) {
    const infoBoxList = document.querySelector('.validations ul');
    // Prevent duplicate messages
    const existingMsg = Array.from(infoBoxList.children).find(li => li.textContent.includes("corregir los datos de Teléfono"));
    if (!existingMsg) {
      const newLi = document.createElement('li');
      newLi.textContent = "Por favor, corregir los datos de Teléfono.";
      newLi.style.color = "red"; // Or some other highlighting
      newLi.id = "phone-error-message"; // Add an ID to easily remove it later
      infoBoxList.appendChild(newLi);
    }
  } else {
    // If there's no phone error, or a different error, remove the message
    const phoneErrorMsg = document.getElementById('phone-error-message');
    if (phoneErrorMsg) {
      phoneErrorMsg.remove();
    }
  }
}

document.addEventListener('DOMContentLoaded', () => {
  const addRowBtn = document.getElementById('addRowBtn');
  const exportBtn = document.getElementById('exportBtn');
  // Assign to the global dataTable variable
  dataTable = document.getElementById('dataTable').getElementsByTagName('tbody')[0];

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
    displayNotification(""); // Clear previous general notifications
    const filenameInput = document.getElementById('txtFilename');
    if (filenameInput) { // Ensure filenameInput exists before removing class
        filenameInput.classList.remove('invalid-input'); // Clear previous filename input style
    }

    // 1. Validate Table Mandatory Fields
    const rows = dataTable.rows; // dataTable is the tbody
    const mandatoryColumnIndices = [0, 1, 2, 3, 4];
    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      for (const columnIndex of mandatoryColumnIndices) {
        const cell = row.cells[columnIndex];
        if (cell && cell.textContent.trim() === "") {
          validateCell(cell, columnIndex); // Ensure cell is styled
        }
      }
    }

    if (Object.keys(validations).length > 0) {
      displayNotification("Hay errores en el formulario. Por favor, corríjalos antes de exportar.");
      return;
    }

    // 2. Validate Filename Input
    // Ensure filenameInput exists before accessing its value
    let desiredFilename = "";
    if (filenameInput) {
        desiredFilename = filenameInput.value.trim();
    }

    if (desiredFilename === "") {
      displayNotification("El nombre del archivo TXT es requerido.");
      if (filenameInput) { // Ensure filenameInput exists before adding class
        filenameInput.classList.add('invalid-input');
      }
      return;
    }

    // 3. Process Filename (add .txt extension)
    if (!desiredFilename.toLowerCase().endsWith('.txt')) {
      desiredFilename += '.txt';
    }

    // 4. Generate Table Content for Export (IF ALL VALIDATIONS PASSED)
    let content = '';
    for (let i = 0; i < rows.length; i++) {
      const cells = rows[i].cells;
      const rowData = [];
      for (let j = 0; j < cells.length; j++) {
        let cellValue = cells[j].textContent.trim();
        if (j === 5) { // "Monto máximo" column special handling
          const numericValue = parseFloat(cellValue);
          if (!isNaN(numericValue) && isFinite(numericValue)) {
            cellValue = (numericValue * 100).toString();
          } else {
            cellValue = "999999";
          }
        }
        rowData.push(cellValue);
      }
      content += rowData.join(';') + '\n';
    }

    // 5. Create Blob and Trigger Download
    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' }); // Added charset
    const anchor = document.createElement('a');
    anchor.download = desiredFilename;
    anchor.href = window.URL.createObjectURL(blob);
    anchor.style.display = 'none';
    document.body.appendChild(anchor);
    anchor.click();
    document.body.removeChild(anchor);
    window.URL.revokeObjectURL(anchor.href);
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
