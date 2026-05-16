import { BootstrapForm } from "./bootstrap-form";
import { ForgotPassword } from "./forgot-password";
import { Login } from "./login";
import { Signup } from "./signup";

const VIEWS = {
  login: "login",
  signup: "signup",
  "forgot-password": "forgot-password",
  bootstrap: "bootstrap",
};

/**
 * Parent: switches child auth UIs. Layout is applied in the page wrapper.
 * @param {{ view?: "login" | "signup" | "forgot-password" | "bootstrap" }} props
 */
export function Auth({ view = VIEWS.login }) {
  return (
    <div className="w-full max-w-md">
      {view === VIEWS.login && <Login />}
      {view === VIEWS.signup && <Signup />}
      {view === VIEWS["forgot-password"] && <ForgotPassword />}
      {view === VIEWS.bootstrap && <BootstrapForm />}
    </div>
  );
}

export { VIEWS as authViews };
