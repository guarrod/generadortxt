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
    }
    return newRow; // Return the new row
  }

  // Add new row to the table
  addRowBtn.addEventListener('click', createAndAppendNewRow);

  // Export table data to TXT file
  exportBtn.addEventListener('click', () => {
    let content = '';
    const rows = dataTable.rows;
    for (let i = 0; i < rows.length; i++) {
      const cells = rows[i].cells;
      const rowData = [];
      for (let j = 0; j < cells.length; j++) {
        rowData.push(cells[j].innerText);
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
        currentRow = createAndAppendNewRow();
        currentTargetCellIndex = 0; // Start from the first cell for new rows
      }

      cellValues.forEach((cellValue, colIndex) => {
        const finalCellIndex = currentTargetCellIndex + colIndex;
        if (finalCellIndex < currentRow.cells.length) {
          currentRow.cells[finalCellIndex].textContent = cellValue;
        }
      });
    });
  });
});
