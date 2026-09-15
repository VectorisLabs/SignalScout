import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, expect, it, vi } from "vitest";
import { MemoryRouter } from "react-router-dom";
import { CasePackageSchema } from "@corpwatch/backend/contracts";
import casePackage from "../../../public/demo/case-package.json";
import { LandingPage } from "./LandingPage";

const buildCase = () => CasePackageSchema.parse(structuredClone(casePackage));
const renderLanding = () => render(<MemoryRouter><LandingPage /></MemoryRouter>);

afterEach(() => { cleanup(); vi.restoreAllMocks(); });

it("renders the marketing landing with a CTA into the chat app", () => {
  vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: true, json: async () => buildCase() }));
  renderLanding();
  expect(screen.getByRole("heading", { name: /See the change before the headline/ })).toBeInTheDocument();
  expect(screen.getByRole("navigation", { name: "Primary navigation" })).toBeInTheDocument();
  const cta = screen.getAllByRole("link", { name: /Open signalScout/i });
  expect(cta.length).toBeGreaterThan(0);
  expect(cta[0]).toHaveAttribute("href", "/chat");
  expect(screen.getAllByText(/Northstar Home Retail is fictional/i).length).toBeGreaterThan(0);
});

it("renders the validated evidence showcase once the case bundle loads", async () => {
  vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: true, json: async () => buildCase() }));
  renderLanding();
  await waitFor(() => expect(screen.getByRole("heading", { name: /Compare response posture/ })).toBeInTheDocument());
  expect(screen.getByRole("heading", { name: /Coverage before conviction/ })).toBeInTheDocument();
  expect(screen.getByText("MAINTAIN")).toBeInTheDocument();
  expect(screen.getByText("ACCELERATE")).toBeInTheDocument();
  expect(screen.getByLabelText("As-of date")).toBeInTheDocument();
});

it("does not reveal a future outcome in an earlier replay frame", async () => {
  vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: true, json: async () => buildCase() }));
  renderLanding();
  await screen.findByLabelText("As-of date");
  fireEvent.change(screen.getByLabelText("As-of date"), { target: { value: "0" } });
  expect(screen.queryByText("Public restructuring outcome")).not.toBeInTheDocument();
  expect(screen.queryByText(/court-supervised restructuring process/i)).not.toBeInTheDocument();
  expect(screen.getByRole("option", { name: "Aug 31, 2022" })).toBeInTheDocument();
});
