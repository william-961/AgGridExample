 
import { FormProvider, useForm } from 'react-hook-form'
import './App.css'
import {ReactFormDataGridModel} from './components/ReactFormControllers/ReactFormDataGridModel'

function App() {

  const formProps = useForm({
    
  })
 
  return (
    <form onSubmit={formProps.handleSubmit((data) => console.log(data))}>
      <FormProvider {...formProps as any}>
        <MyForm/>
        <button type='submit'>
          Send
        </button>
      </FormProvider>
    </form>
  )
}

export default App


function MyForm(){



  return (  
     <>
     <h1>Ag Grid Version 31</h1>
     <ReactFormDataGridModel
      name='rows'
      columnDefs={[
        {
          field : "name"
        },
        {
          field : "price"
        }
      ]}

    />  
     </>
  )
}