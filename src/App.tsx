/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import PulseGame from './components/PulseGame';
import { Toaster } from './components/ui/sonner';

export default function App() {
  return (
    <main className="dark">
      <PulseGame />
      <Toaster position="top-center" theme="dark" />
    </main>
  );
}

