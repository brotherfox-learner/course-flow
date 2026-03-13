import { useState } from "react";
import { useAuth } from "@/context/AuthContext";

export default function useChangeEmail() {

  const { token } = useAuth();

  const [form, setForm] = useState({
    email: "",
    newEmail: "",
    password: ""
  });

  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;

    setForm((prev) => ({
      ...prev,
      [name]: value
    }));

    setErrors((prev) => ({
      ...prev,
      [name]: ""
    }));
  };

  const validate = () => {

    const newErrors = {};
    const emailRegex = /\S+@\S+\.\S+/;

    if (!form.email) {
      newErrors.email = "Current email is required";
    }
    else if (!emailRegex.test(form.email)) {
      newErrors.email = "Invalid email format";
    }

    if (!form.newEmail) {
      newErrors.newEmail = "New email is required";
    }
    else if (!emailRegex.test(form.newEmail)) {
      newErrors.newEmail = "Invalid email format";
    }
    else if (form.newEmail === form.email) {
      newErrors.newEmail = "New email must be different";
    }

    if (!form.password) {
      newErrors.password = "Password is required";
    }
    else if (form.password.length < 8) {
      newErrors.password = "Password must be at least 8 characters";
    }

    return newErrors;
  };

  const submit = async (e) => {

    e.preventDefault();

    if (isLoading) return;

    const validationErrors = validate();

    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    if (!token) {
      setErrors({ form: "Session expired. Please login again." });
      return;
    }

    setIsLoading(true);

    try {

      const res = await fetch("/api/auth/change-email", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          email: form.email.trim(),
          newEmail: form.newEmail.trim(),
          password: form.password
        })
      });

      const dataRes = await res.json();

      if (!res.ok) throw new Error(dataRes.message);

      setSuccess(true);   // ⭐ เปิด modal

      setForm({
        email: "",
        newEmail: "",
        password: ""
      });

    } catch (error) {

      if (error.message === "Current email does not match") {
        setErrors({ email: error.message });
      }
      else if (error.message === "Incorrect password") {
        setErrors({ password: error.message });
      }
      else {
        setErrors({ form: error.message || "Something went wrong" });
      }

    } finally {
      setIsLoading(false);
    }
  };

  return {
    form,
    errors,
    handleChange,
    submit,
    isLoading,
    success,
    setSuccess
  };
}