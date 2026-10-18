# HaloCrew BioGlove — arrows and functional labels

Open the presentation file for the view you need:

- `HaloCrew_BioGlove_Dorsal_Labeled.FCStd`: protective panels, flexible joint band, detachable module, interaction button, cuff strap and quick-release closure.
- `HaloCrew_BioGlove_Palm_Labeled.FCStd`: PPG optical window, both EDA electrodes, contact temperature sensor, optional ECG wrist contact and textile shell.
- `HaloCrew_BioGlove_Electronics_Labeled.FCStd`: MCU, wireless module, IMU, battery, haptic motor, sensor connectors, charging contacts and optional ECG opposite-hand contact. The cover and PCB are hidden to expose the internal envelopes. No physical components are moved or deleted.

Each file contains all three label groups under **09 Arrow labels**. The selected group is visible by default. Native text and explicit arrow-wire geometry are retained inside the editable CAD document. Every callout has a `TargetComponent` link identifying its physical source. The arrow anchors use the modeled component bounds, rather than guessed screenshot coordinates.

## Apply labels to your currently edited model

Use the supplied macro if your open model has changes you want to retain:

1. Open your existing BioGlove model in FreeCAD and make it the active document.
2. Download `add_bioglove_labels.FCMacro` into a local folder.
3. Open **Macro > Macros**, set the macro folder to that local folder, select `add_bioglove_labels.FCMacro`, and choose **Execute**.
4. The default is the dorsal presentation. To choose another view, edit the line `VIEW = os.environ.get('BIOGLOVE_LABEL_VIEW','DORSAL').upper()` in the macro, replacing `DORSAL` with `PALM` or `ELECTRONICS`, then execute it again.
5. Use **File > Save As** to save your annotated version. The macro itself does not save or overwrite your file.

The macro checks for the BioGlove's named components and refreshes only its own `BioLabel_` objects. It also switches the camera and relevant component visibility for the selected presentation. Running it again is safe for the physical Bodies, but replaces your manually edited callout text/positions with the definitions in the macro. Customize those definitions if you want your edits retained on subsequent executions.

## Edit and present

Select a text label in the tree. In its **Data** properties, edit `LabelText` to change its two text lines and `TextPosition` to move it. In **View**, change `FontSize` or `TextColor` for your presentation background. The associated arrow is a separately named native wire feature: move it as well if you reposition a label. For consistent changes, edit the label-position coordinates in the macro and rerun it.

Changing hand or component dimensions does not dynamically regenerate the arrow geometry. Rerun the macro after such edits to refresh component anchors. Target-component links remain available for identification.

For screenshots, click empty space to clear green selection highlighting and collapse the model tree / Tasks panel as desired. Labels are easiest to read in the supplied top and bottom views; rotating the camera can cause some leader lines to overlap.

The sensor and electronics labels describe intended functions of provisional packaging envelopes. They do not certify that the glove measures those signals, imply validated clinical performance, or establish a completed electronic circuit. Hardware dimensions and retention mechanisms retain the development limitations documented in the original assembly guide.
