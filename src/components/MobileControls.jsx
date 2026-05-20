import React, { useRef, useEffect } from 'react';

export default function MobileControls({ mobileInputRef, visible = true, disabled = false }) {
  const pointerMap = useRef({});
  const [active, setActive] = React.useState({});

  useEffect(() => {
    // ensure mobileInputRef exists
    if (mobileInputRef && !mobileInputRef.current) {
      mobileInputRef.current = { left: false, right: false, up: false, down: false, jump: false, jumpHeld: false, jumpPressed: false };
    }
    // cleanup on unmount
    return () => {
      clearMobileInput();
    };
  }, [mobileInputRef]);

  const setControl = (control, value, pointerId) => {
    if (!mobileInputRef) return;
    mobileInputRef.current = mobileInputRef.current || { left: false, right: false, up: false, down: false, jump: false, jumpHeld: false, jumpPressed: false };
    if (control === 'jump') {
      // jumpHeld tracks hold state; jumpPressed is a one-shot flag on down
      mobileInputRef.current.jump = value;
      mobileInputRef.current.jumpHeld = value;
      if (value) mobileInputRef.current.jumpPressed = true;
      else mobileInputRef.current.jumpPressed = false;
    } else {
      mobileInputRef.current[control] = value;
    }
    if (pointerId == null) return;
    if (value) pointerMap.current[pointerId] = control;
    else delete pointerMap.current[pointerId];
    setActive((a) => ({ ...a, [control]: !!mobileInputRef.current[control] }));
  };

  const onDown = (e) => {
    e.preventDefault();
    e.stopPropagation();
    const control = e.currentTarget.dataset.control;
    const id = e.pointerId;
    e.currentTarget.setPointerCapture?.(id);
    setControl(control, true, id);
  };

  const onUp = (e) => {
    e.preventDefault();
    e.stopPropagation();
    const id = e.pointerId;
    const control = pointerMap.current[id] || e.currentTarget.dataset.control;
    if (control) setControl(control, false, id);
    e.currentTarget.releasePointerCapture?.(id);
  };

  const clearMobileInput = () => {
    if (!mobileInputRef) return;
    mobileInputRef.current = { left: false, right: false, up: false, down: false, jump: false, jumpHeld: false, jumpPressed: false };
    pointerMap.current = {};
    setActive({});
  };

  // clear inputs when visibility or disabled changes
  useEffect(() => {
    if (!visible || disabled) clearMobileInput();
  }, [visible, disabled]);

  // Visible only on small screens / touch devices via CSS
  if (!visible) return null;
  return (
    <div className={`mobile-controls ${disabled ? 'disabled' : ''}`} onPointerDown={(e) => e.stopPropagation()} onPointerUp={(e) => e.stopPropagation()}>
      <div className="mobile-dpad" role="group" aria-label="D-pad">
        <button className={`dpad-up mobile-control-button ${active.up ? 'active' : ''}`} data-control="up" onPointerDown={onDown} onPointerUp={onUp} onPointerCancel={onUp} onPointerLeave={onUp}>▲</button>
        <div className="mobile-dpad-row">
          <button className={`dpad-left mobile-control-button ${active.left ? 'active' : ''}`} data-control="left" onPointerDown={onDown} onPointerUp={onUp} onPointerCancel={onUp} onPointerLeave={onUp}>◀</button>
          <button className={`dpad-right mobile-control-button ${active.right ? 'active' : ''}`} data-control="right" onPointerDown={onDown} onPointerUp={onUp} onPointerCancel={onUp} onPointerLeave={onUp}>▶</button>
        </div>
        <button className={`dpad-down mobile-control-button ${active.down ? 'active' : ''}`} data-control="down" onPointerDown={onDown} onPointerUp={onUp} onPointerCancel={onUp} onPointerLeave={onUp}>▼</button>
      </div>

      <div className="mobile-actions">
        <button className={`mobile-jump-button ${active.jump ? 'active' : ''}`} data-control="jump" onPointerDown={onDown} onPointerUp={onUp} onPointerCancel={onUp} onPointerLeave={onUp}>SKOK</button>
      </div>
    </div>
  );
}
