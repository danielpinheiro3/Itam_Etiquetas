import React from 'react';
import { LabelTemplate, Material, LabelElement, LabelRotation } from '../types';
import { BarcodeRenderer } from './BarcodeRenderer';
import { Image as ImageIcon } from 'lucide-react';

interface LabelViewProps {
  template: LabelTemplate;
  material: Material;
  controle?: string;
  selectedElementId?: string | null;
  onSelectElement?: (elementId: string) => void;
  scale?: number;
  isEditable?: boolean;
  className?: string;
  showCutGuide?: boolean;
  rotation?: LabelRotation; // 0, 90, 180, 270
}

export const LabelView: React.FC<LabelViewProps> = ({
  template,
  material,
  controle = '',
  selectedElementId,
  onSelectElement,
  scale = 1,
  isEditable = false,
  className = '',
  showCutGuide = false,
  rotation = 0
}) => {
  const hasExplicitControleElement = template.elements.some(
    (el) => el.visible && el.type === 'field' && el.fieldKey === 'controle'
  );

  const getElementText = (el: LabelElement): string => {
    if (el.type === 'static-text') {
      return el.staticText || '';
    }
    if (el.type === 'field' && el.fieldKey) {
      if (el.fieldKey === 'controle') {
        const val = (controle || '').trim();
        if (!val) {
          // In editor preview, show placeholder number so the element is visible for editing
          return isEditable ? `${el.labelPrefix || ''}45879` : '';
        }
        // Display user's manual control directly
        return `${el.labelPrefix || ''}${val}`;
      }

      if (el.fieldKey === 'descricao') {
        const desc = (material.descricao || '').trim();
        const ctrl = (controle || '').trim();
        // Requirement: If template DOES NOT have a separate visible controle element,
        // incorporate Controle directly into Descrição (ex: "Bucha de Nylon - S. 08")
        // NEVER show the word "CONTROLE"
        if (ctrl && !hasExplicitControleElement) {
          return `${el.labelPrefix || ''}${desc} - ${ctrl}`;
        }
        return `${el.labelPrefix || ''}${desc}`;
      }

      if (el.fieldKey === 'codigo') {
        return `${el.labelPrefix || ''}${material.codigo || ''}`;
      }

      if (el.fieldKey === 'unidade') {
        return `${el.labelPrefix || ''}${material.unidade || ''}`;
      }
    }
    return '';
  };

  const getBarcodeValue = (): string => {
    return (material.codigo || '10001').trim();
  };

  const isRotated90or270 = rotation === 90 || rotation === 270;

  // Outer physical container dimensions
  const outerWidthMm = isRotated90or270 ? template.heightMm : template.widthMm;
  const outerHeightMm = isRotated90or270 ? template.widthMm : template.heightMm;

  // Offset to center the inner template box when rotated
  const offsetX = isRotated90or270 ? (template.heightMm - template.widthMm) / 2 : 0;
  const offsetY = isRotated90or270 ? (template.widthMm - template.heightMm) / 2 : 0;

  return (
    <div
      className={`relative select-none text-slate-900 ${
        showCutGuide ? 'border border-dashed border-slate-400' : ''
      } ${className}`}
      style={{
        width: `${outerWidthMm * scale}mm`,
        height: `${outerHeightMm * scale}mm`,
        minWidth: `${outerWidthMm * scale}mm`,
        minHeight: `${outerHeightMm * scale}mm`,
        boxSizing: 'border-box',
        overflow: 'hidden',
        backgroundColor: template.backgroundColor || '#ffffff'
      }}
    >
      {/* Inner container with exact physical dimensions and rotation */}
      <div
        style={{
          width: `${template.widthMm * scale}mm`,
          height: `${template.heightMm * scale}mm`,
          position: 'absolute',
          left: `${offsetX * scale}mm`,
          top: `${offsetY * scale}mm`,
          borderWidth: template.borderWidth > 0 ? `${Math.max(1, template.borderWidth * scale)}px` : '0px',
          borderStyle: template.borderWidth > 0 ? 'solid' : 'none',
          borderColor: template.borderColor || '#000000',
          borderRadius: `${template.borderRadiusMm * scale}mm`,
          backgroundColor: template.backgroundColor || '#ffffff',
          padding: `${template.paddingMm * scale}mm`,
          boxSizing: 'border-box',
          overflow: 'hidden',
          transform: rotation !== 0 ? `rotate(${rotation}deg)` : 'none',
          transformOrigin: 'center center'
        }}
      >
        {template.elements.map((el) => {
          if (!el.visible) return null;

          if (el.type === 'field' && el.fieldKey === 'controle' && !controle.trim() && !isEditable) {
            return null;
          }

          const isSelected = isEditable && selectedElementId === el.id;

          const baseStyle: React.CSSProperties = {
            position: 'absolute',
            left: `${el.x * scale}mm`,
            top: `${el.y * scale}mm`,
            width: `${el.width * scale}mm`,
            height: `${el.height * scale}mm`,
            fontSize: `${el.fontSize * scale}pt`,
            fontFamily: el.fontFamily,
            fontWeight: el.fontWeight,
            fontStyle: el.fontStyle || 'normal',
            textAlign: el.textAlign,
            color: el.color,
            backgroundColor: el.backgroundColor || 'transparent',
            borderWidth: el.borderWidth ? `${Math.max(1, el.borderWidth * scale)}px` : '0px',
            borderStyle: el.borderWidth ? 'solid' : 'none',
            borderColor: el.borderColor || 'transparent',
            borderRadius: el.borderRadius ? `${el.borderRadius * scale}mm` : '0px',
            lineHeight: 1.15,
            boxSizing: 'border-box',
            overflow: 'hidden',
            display: 'flex',
            alignItems: el.type === 'box' || el.type === 'rectangle' ? 'center' : (el.textAlign === 'center' ? 'center' : 'flex-start'),
            justifyContent: el.textAlign === 'center' ? 'center' : (el.textAlign === 'right' ? 'flex-end' : 'flex-start'),
            cursor: isEditable ? (el.locked ? 'not-allowed' : 'move') : 'default'
          };

          const textContent = getElementText(el);

          return (
            <div
              key={el.id}
              id={el.id}
              onClick={(e) => {
                if (isEditable && onSelectElement) {
                  e.stopPropagation();
                  onSelectElement(el.id);
                }
              }}
              className={`transition-shadow ${
                isSelected
                  ? 'ring-2 ring-amber-500 ring-offset-1 z-20 shadow-sm'
                  : isEditable
                  ? 'hover:ring-1 hover:ring-amber-300 z-10'
                  : ''
              }`}
              style={baseStyle}
              title={isEditable ? `${el.name} (${el.x}mm, ${el.y}mm)` : undefined}
            >
              {/* Text & Field */}
              {(el.type === 'field' || el.type === 'static-text') && (
                <span className="w-full break-words whitespace-pre-wrap leading-tight">
                  {textContent || (isEditable ? `[${el.name}]` : '')}
                </span>
              )}

              {/* Barcode */}
              {el.type === 'barcode' && (
                <div className="w-full h-full flex items-center justify-center pointer-events-none">
                  <BarcodeRenderer
                    value={getBarcodeValue()}
                    format={el.barcodeFormat || 'CODE128'}
                    displayValue={el.barcodeShowText !== false}
                    height={((el.barcodeHeight || (el.height * 0.7)) * scale) * 3.78}
                    fontSize={Math.max(7, el.fontSize * scale)}
                    fontFamily={el.fontFamily}
                    lineColor={el.color || '#000000'}
                    className="w-full h-full"
                  />
                </div>
              )}

              {/* Logo / Image */}
              {(el.type === 'logo' || el.type === 'image') && (
                <div className="w-full h-full flex items-center justify-center pointer-events-none overflow-hidden">
                  {el.imageUrl ? (
                    <img
                      src={el.imageUrl}
                      alt={el.name}
                      className="w-full h-full pointer-events-none"
                      style={{
                        objectFit: el.keepAspectRatio !== false ? 'contain' : 'fill',
                        objectPosition: `${el.textAlign || 'center'} ${el.alignVertical || 'middle'}`
                      }}
                    />
                  ) : (
                    <div className="w-full h-full border border-dashed border-slate-300 bg-slate-50/50 flex flex-col items-center justify-center text-slate-400 text-[9px] p-1">
                      <ImageIcon className="w-4 h-4 mb-0.5" />
                      <span>{el.name}</span>
                    </div>
                  )}
                </div>
              )}

              {/* Line element */}
              {el.type === 'line' && (
                <div
                  className="w-full h-full pointer-events-none"
                  style={{
                    backgroundColor: el.color || '#000000',
                    height: `${Math.max(1, (el.borderWidth || 1) * scale)}px`,
                    alignSelf: 'center'
                  }}
                />
              )}

              {/* Rectangle / Box element */}
              {(el.type === 'rectangle' || el.type === 'box') && null}
            </div>
          );
        })}
      </div>
    </div>
  );
};
