import { Toast } from "../utils/sweetalert";

const withSuccessAlert = (fn, successMessage) => {
  return async (...args) => {
    const result = await fn(...args);
    if (result) {
      Toast.fire({
        icon: "success",
        title: successMessage,
      });
    }
    return result;
  };
};

export default withSuccessAlert;
