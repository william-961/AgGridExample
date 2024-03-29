import { DataGrid, IDataGridProps } from "../abstractions/BaseAbstractionGrid";
import { CellValueChangedEvent } from "ag-grid-community";
import { useCallback } from "react"; 
import { useFieldArray } from "../../hooks/useFieldArray";

 
 

 
export interface ReactFormFieldProps{
  name : string,
  rules ?: any,
}
 
export function ReactFormDataGridModel<TData>({
  name,
  rules,   
  ...props
}: IDataGridProps & ReactFormFieldProps ) {
   
 
  const {
    fields,
    update,
    append, 
  } = useFieldArray({
    name,
    rules, 
    mumberOfVirtualRow : 1,
  })
 
  
 
 
  const cellValueChangeHandler = useCallback((e : CellValueChangedEvent)=>{  
    update(e.node.id!,{...e.data,$isVirtual : false})  
  },[update,fields]);

  const addRecord = () =>{
    append({}) 
  }
 
   
 
   

  return (  
      <>
      {JSON.stringify(fields.map((e)=>e.$guid))}
      <DataGrid
        rowHeight={32}  
        stopEditingWhenCellsLoseFocus
        {...props as any}
        getRowId={(params) => params?.data?.$guid}  
        suppressScrollOnNewData 
        columnMenu="new"
        defaultColDef={{ 
          resizable : true, 
          editable : true,  
          filter : true,
          sortable : true, 
          ...props.defaultColDef,    
        }} 
        rowData={fields}  
        singleClickEdit={true}  
        onCellValueChanged={cellValueChangeHandler}  
        isFullWidthRow={(params)=>{  
          return params.rowNode.isRowPinned() && params.rowNode.data === "$actions"; 
        }} 
        fullWidthCellRendererParams={{addRecord}} 
      />  
      </>
  );
}
 