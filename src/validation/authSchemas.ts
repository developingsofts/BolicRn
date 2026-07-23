import * as Yup from "yup";

export const loginSchema = Yup.object().shape({
  email: Yup.string()
    .email("Please enter a valid email address")
    .matches(
      /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/,
      "Email must be in format: example@domain.com"
    )
    .test("has-at-and-dot", "Email must contain @ and a domain (e.g., user@example.com)", (value) => {
      if (!value) return false;
      return value.includes("@") && value.includes(".") && value.indexOf("@") < value.lastIndexOf(".");
    })
    .required("Email is required"),
  password: Yup.string()
    .min(6, "Password must be at least 6 characters")
    .required("Password is required"),
});

export const signUpSchema = Yup.object().shape({
  email: Yup.string()
    .email("Please enter a valid email address")
    .matches(
      /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/,
      "Email must be in format: example@domain.com"
    )
    .test("has-at-and-dot", "Email must contain @ and a domain (e.g., user@example.com)", (value) => {
      if (!value) return false;
      return value.includes("@") && value.includes(".") && value.indexOf("@") < value.lastIndexOf(".");
    })
    .required("Email is required"),
  password: Yup.string()
    .min(6, "Password must be at least 6 characters")
    .matches(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
      "Password must contain uppercase, lowercase, and number"
    )
    .required("Password is required"),
  displayName: Yup.string()
    .min(2, "Name must be at least 2 characters")
    .max(50, "Name must not exceed 50 characters")
    .required("Display name is required"),
  phoneNumber: Yup.string()
    .matches(/^\+?\d{10,15}$/, "Please enter a valid phone number (10-15 digits)")
    .required("Phone number is required"),
  verificationCode: Yup.string()
    .matches(/^\d{6}$/, "Verification code must be 6 digits")
    .optional(),
  age: Yup.number()
    .typeError("Age must be a number")
    .integer("Age must be a whole number")
    .min(13, "You must be at least 13 years old")
    .max(120, "Age must not exceed 120 years")
    .required("Age is required"),
  trainingTypes: Yup.array()
    .of(Yup.string())
    .min(1, "Please select at least one training type")
    .required("Training types are required"),
  userGender: Yup.string()
    .oneOf(["Male", "Female", "Non-binary", "Prefer not to say"], "Please select a valid gender")
    .required("Please select your gender"),
  genderPreference: Yup.string()
    .oneOf(["All", "Same Gender Only", "Opposite Gender Only"], "Please select a valid preference")
    .required("Please select your training partner preference"),
  currentPRs: Yup.string().optional(),
});
