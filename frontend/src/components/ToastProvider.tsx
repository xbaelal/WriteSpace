import { Toaster } from "react-hot-toast";

const ToastProvider = () => {
  return (
    <Toaster
      position="top-right"
      reverseOrder={false}
      gutter={8}
      containerClassName=""
      containerStyle={{}}
      toastOptions={{
        duration: 3000,
        style: {
          background: "#363636",
          color: "#fff",
          padding: "16px",
          borderRadius: "8px",
        },
        success: {
          duration: 3000,
          iconTheme: {
            primary: "#22c55e",
            secondary: "#fff",
          },
        },
        error: {
          duration: 4000,
          iconTheme: {
            primary: "#ef4444",
            secondary: "#fff",
          },
        },
      }}
    ></Toaster>
  );
};

export default ToastProvider;
