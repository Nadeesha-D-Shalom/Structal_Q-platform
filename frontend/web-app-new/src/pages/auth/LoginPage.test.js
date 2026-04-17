import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import LoginPage from "./LoginPage";

test("LoginPage renders email label and login button", () => {
  render(
    <MemoryRouter>
      <LoginPage />
    </MemoryRouter>
  );
  expect(screen.getByRole("button", { name: /login/i })).toBeInTheDocument();
  expect(screen.getByText(/Email or Username/i)).toBeInTheDocument();
});
