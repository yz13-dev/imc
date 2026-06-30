import { Suspense } from "react";
import Form from "./components/form";



export default function Page() {
  return (
    <div>
      <Suspense fallback={<></>}>
        <Form />
      </Suspense>
    </div>
  )
}
