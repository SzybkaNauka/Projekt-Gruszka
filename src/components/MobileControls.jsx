import React, { useEffect, useRef } from 'react';

const EMPTY_INPUT = { left: false, right: false, up: false, down: false, jump: false, jumpHeld: false, jumpPressed: false };

export default function MobileControls({ mobileInputRef, visible = true, disabled = false }) {
  const pointerMap = useRef({});
  const [active, setActive] = React.useState({});

  const clearMobileInput = () => {
    if (!mobileInputRef) return;
    mobileInputRef.current = { ...EMPTY_INPUT };
    pointerMap.current = {};
    setActive({});
  };

  useEffect(() => {
    if (mobileInputRef && !mobileInputRef.current) {
      mobileInputRef.current = { ...EMPTY_INPUT };
    }
    return () => clearMobileInput();
  }, [mobileInputRef]);

  useEffect(() => {
    if (!visible || disabled) clearMobileInput();
  }, [visible, disabled]);

  const setControl = (control, value, pointerId) => {
    if (!mobileInputRef) return;
    mobileInputRef.current = mobileInputRef.current || { ...EMPTY_INPUT };
    if (control === 'jump') {
      mobileInputRef.current.jump = value;
      mobileInputRef.current.jumpHeld = value;
      mobileInputRef.current.jumpPressed = value;
    } else {
      mobileInputRef.current[control] = value;
    }
    if (pointerId != null) {
      if (value) pointerMap.current[pointerId] = control;
      else delete pointerMap.current[pointerId];
    }
    setActive((current) => ({ ...current, [control]: !!mobileInputRef.current[control] }));
  };

  const onDown = (event) => {
    event.preventDefault();
    event.stopPropagation();
    const control = event.currentTarget.dataset.control;
    const id = event.pointerId;
    event.currentTarget.setPointerCapture?.(id);
    setControl(control, true, id);
  };

  const onUp = (event) => {
    event.preventDefault();
    event.stopPropagation();
    const id = event.pointerId;
    const control = pointerMap.current[id] || event.currentTarget.dataset.control;
    if (control) setControl(control, false, id);
    event.currentTarget.releasePointerCapture?.(id);
  };

  if (!visible) return null;

  return (
    <div className={`mobile-controls ${disabled ? 'disabled' : ''}`} onPointerDown={(event) => event.stopPropagation()} onPointerUp={(event) => event.stopPropagation()}>
      <div className="mobile-dpad vertical-only" role="group" aria-label="Sterowanie gora dol">
        <button className={`dpad-up mobile-control-button ${active.up ? 'active' : ''}`} data-control="up" onPointerDown={onDown} onPointerUp={onUp} onPointerCancel={onUp} onPointerLeave={onUp}>▲</button>
        <button className={`dpad-down mobile-control-button ${active.down ? 'active' : ''}`} data-control="down" onPointerDown={onDown} onPointerUp={onUp} onPointerCancel={onUp} onPointerLeave={onUp}>▼</button>
      </div>

      <div className="mobile-actions">
        <button className={`mobile-jump-button ${active.jump ? 'active' : ''}`} data-control="jump" onPointerDown={onDown} onPointerUp={onUp} onPointerCancel={onUp} onPointerLeave={onUp}>SKOK</button>
      </div>
    </div>
  );
}
