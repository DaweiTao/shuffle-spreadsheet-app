let originalTable = null;
let isShuffled = false;
let panel = new mdui.Panel('#panel');
// panel.close("all")
panel.open(0);
let shuffleOption = "col";
let excludeCol = "";
let excludeRow = "";
let drawer = new mdui.Drawer('#left-drawer', {});
drawer.close();


document.getElementById('panel-0-header').addEventListener('click', function () {
    panel.toggle(0);
});


document.getElementById('panel-1-header').addEventListener('click', function () {
    if (originalTable !== null){
        panel.toggle(1);
    }
});


document.getElementById('panel-2-header').addEventListener('click', function () {
    if (isShuffled) {
        panel.toggle(2);
    };
});

document.getElementById('setting-btn').addEventListener('click', function () {
    drawer.toggle();
});

// document.getElementById('left-drawer').addEventListener('click', function () {
//     drawer.toggle();
// });


document.getElementById('confirm-setting').addEventListener('click', function () {
    shuffleOption = document.querySelector('input[name="shuffle-option"]:checked').value;
    console.log("Shuffle option: " + shuffleOption);
    excludeColInput = document.getElementById("exclude-col").value;
    excludeRowInput = document.getElementById("exclude-row").value;
    excludeColInput = excludeColInput.replace(/\s+/g, '');
    excludeRowInput = excludeRowInput.replace(/\s+/g, '');
    validateCol = excludeColInput.replace(/[0-9,]/g, '');
    validateRow = excludeRowInput.replace(/[0-9,]/g, '');
    console.log(`validate row: <${validateRow}>`);
    console.log(`validate col: <${validateCol}>`);
    
    if (validateRow !== "" || validateCol !== ""){
        mdui.dialog({
            title: "操作失敗", 
            content: "輸入無效！自定義排除範圍只可輸入數字, 英文逗號, 空格",
            buttons: [
                {
                    text: '确认',
                }
            ]
        })
        return;
    } 
    
    let excludeRowArray = [];
    excludeRowInput = excludeRowInput.split(",");
    
    for (i = 0; i < excludeRowInput.length; i++) {
        if (excludeRowInput[i] !== "") {
            excludeRowArray.push(parseInt(excludeRowInput[i]) - 1);
        }
    }
    
    let excludeColArray = [];
    excludeColInput = excludeColInput.split(",");
    for (i = 0; i < excludeColInput.length; i++) {
        if (excludeColInput[i] !== "") {
            excludeColArray.push(parseInt(excludeColInput[i]) - 1);
        }
    }
    
    excludeRow = excludeRowArray;
    excludeCol = excludeColArray;
    console.log("Exclude-row: <" + excludeRow + ">");
    console.log("Exclude-col: <" + excludeCol + ">");
    
    mdui.snackbar({message:"成功更新設置！", timeout:4000});
    drawer.toggle();
});


function generateHtmlTable(dataTable) {
    tableHtml = "<table class=\"mdui-table mdui-table-hoverable\"><tbody>";

    for (let r = 0; r < dataTable.length; r++){
        tableHtml += "<tr>";
        for(let c = 0; c < dataTable[0].length; c++){
            let element = dataTable[r][c];
            if (typeof(element) == "string"){
                element = element.replace(/(?:\\[rn]|[\r\n]+)+/g, "<br>");
            }
            tableHtml += `<td>${element}</td>`;
        } 
        tableHtml += "</tr>";
    }

    tableHtml += "</tbody></table>";
    return tableHtml;
}


function getDataFromJson(jsonData) {
    console.log("Json data:");
    console.log(jsonData);
    let table = [];

    // extract headers
    let keys = Object.keys(jsonData[0]);
    let headers = [];
    for (let i = 0; i < keys.length; i++){
        headers.push(keys[i]);
    }
    table.push(headers);

    // extract elements row by row
    let rowCount = jsonData.length;
    let colCount = keys.length;
    console.log("row count: " + rowCount);
    console.log("col count: " + colCount);
    for (let r = 0; r < rowCount; r++){
        let row = [];
        jsonRow = jsonData[r];
        for(let c = 0; c < colCount; c++){
            element = jsonRow[keys[c]];
            row.push(element);
        } 
        table.push(row);
    }

    console.log("Extracted data:");
    console.log(table);
    return table;
}


function showFile(obj) {
    let excelFile;

    // let obj = document.getElementById("file");
    if(!obj.files[0]) {
        console.log("No file selected");
        // alert("請選擇文件")
        return;
    }

    mdui.snackbar({message:"表單讀取成功！", timeout:4000});

    let f = obj.files[0];
    let reader = new FileReader();
    reader.readAsBinaryString(f);
    reader.onload = function(e) {
        let data = e.target.result;
        excelFile = XLSX.read(data, {
            type: 'binary'
        });

        let jsonData = XLSX.utils.sheet_to_json(excelFile.Sheets[excelFile.SheetNames[0]]);
        dataTable = getDataFromJson(jsonData);
        originalTable = dataTable;
        tableHtml = generateHtmlTable(dataTable);
        console.log(tableHtml);
        document.getElementById("excelFile").style.display = 'block';
        document.getElementById("excelFile").innerHTML = tableHtml;
    }

    panel.open(1);
    return;
}


function trimTable(unwantedRow, unwantedCol){
    let resultTable = [];

    for(let r = 0; r < originalTable.length; r++) {
        let tempRow = [];
        for(let c = 0; c < originalTable[0].length; c++) {
            if (unwantedRow.includes(r) || unwantedCol.includes(c)){
                continue;
            }
            tempRow.push(originalTable[r][c]);
        }
        if (tempRow.length > 0){
            resultTable.push(tempRow);
        }
    }

    console.log("result table: ");
    console.log(resultTable);
    return resultTable;
}


function shuffleSpreadSheet() {
    if (originalTable == null) {
        mdui.dialog({
            title: "操作失敗", 
            content: "表格無效! 請選擇有效Excel表格 *.csv 或是 *.xlsx",
            buttons: [
                {
                  text: '确认',
                }
            ]
        })
        return;
    }

    // apply exclude rule settings
    resultTable = trimTable(excludeRow, excludeCol);

    // shuffle options
    if (shuffleOption == "row") {
        resultTable = shuffleRow(resultTable)
    } else if (shuffleOption == "col") {
        resultTable = shuffleCol(resultTable)
    } else if (shuffleOption == "all") {
        resultTable = shuffleRow(resultTable)
        resultTable = shuffleCol(resultTable)
    }

    // generate html element
    resultTableHtml = generateHtmlTable(resultTable);
    console.log(resultTable);
    document.getElementById("shuffle-table").style.display = 'block';
    document.getElementById("shuffle-table").innerHTML = resultTableHtml;
    panel.open(2);
    isShuffled = true;
    return;
}


function shuffle(array) {
    array.sort(() => Math.random() - 0.5);
}


function shuffleCol(table){
    //extract cols
    if (table.length <= 0) {
        return [];
    }
    
    let tempTable = [];

    for (let c = 0; c < table[0].length; c++) {
        let tempRow = [];
        for (let r = 0; r < table.length; r++) {
            tempRow.push(table[r][c]);
        }
        if (tempRow.length > 0) {
            tempTable.push(tempRow);
        }
    }

    tempTable = shuffleRow(tempTable);

    let resultTable = [];
    for (let c = 0; c < tempTable[0].length; c++) {
        let tempRow = [];
        for (let r = 0; r < tempTable.length; r++) {
            tempRow.push(tempTable[r][c]);
        }
        if (tempRow.length > 0) {
            resultTable.push(tempRow);
        }
    }

    return resultTable;

}


function shuffleRow(table){
    let resultTable = [];
    
    // deep copy vals
    for (let r = 0; r < table.length; r++) {
        tempRow = [];
        for (let c = 0; c < table[0].length; c++) {
            tempRow.push(table[r][c]);
        }
        if (tempRow.length > 0) {
            resultTable.push(tempRow);
        } 
    }

    for (let r = 0; r < resultTable.length; r++) {
        shuffle(resultTable[r]);
    }

    return resultTable;
}

