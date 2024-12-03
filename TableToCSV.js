class TableToCSV {
    constructor(tableId, fileName, separator = ',') {
        this.tableId = tableId;
        this.fileName = fileName;
        this.separator = separator;
    }

    export() {
        const table = document.getElementById(this.tableId);
        let csv = [];
        for (let row of table.rows) {
            let rowData = [];
            for (let cell of row.cells) {
                rowData.push(cell.innerText);
            }
            csv.push(rowData.join(this.separator));
        }
        const csvString = csv.join('\n');
        this.downloadCSV(csvString);
    }

    downloadCSV(csvString) {
        const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.setAttribute('href', url);
        link.setAttribute('download', this.fileName);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }
}
