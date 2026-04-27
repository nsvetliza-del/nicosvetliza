import React from "react";
import EquipmentWheel from "../components/EquipmentWheel";
import MinimalMenu from "../components/MinimalMenu";
import { equipment } from "../data/equipment";

export default function Equipment() {
  return (
    <main className="equipment-page page-enter-active">
      <MinimalMenu />

      <section className="equipment-content">
        <header className="equipment-intro">
          <p className="equipment-kicker">equipment / tools</p>
          <h1>selected tools, instruments and systems I use to shape sound.</h1>
        </header>

        <EquipmentWheel items={equipment} />
      </section>
    </main>
  );
}
