import {Button as HButton} from "@headlessui/react";

export default function Button (props) {
  return <HButton {...props} className={`cursor-pointer transition-colors rounded-md flex justify-center items-center px-2 py-1 bg-blue-500 text-white ${props.className || ""}`}>
    {props.children}
  </HButton>
}