import React, { useEffect, useRef, useState } from 'react';
import JsBarcode from 'jsbarcode';
import { BarcodeFormat } from '../types';

interface BarcodeRendererProps {
  value: string;
  format?: BarcodeFormat;
  width?: number; // bar width multiplier
  height?: number; // barcode height in px
  displayValue?: boolean;
  fontSize?: number;
  fontFamily?: string;
  lineColor?: string;
  className?: string;
}

export const BarcodeRenderer: React.FC<BarcodeRendererProps> = ({
  value,
  format = 'CODE128',
  width = 1.6,
  height = 40,
  displayValue = true,
  fontSize = 12,
  fontFamily = 'JetBrains Mono',
  lineColor = '#000000',
  className = ''
}) => {
  const svgRef = useRef<SVGSVGElement | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!svgRef.current) return;
    const cleanValue = (value || '').trim();

    if (!cleanValue) {
      setError('Código vazio');
      return;
    }

    try {
      let activeFormat = format;
      let targetValue = cleanValue;

      // Special handling for EAN13 if user selected EAN13 but value is not 12/13 digits
      if (format === 'EAN13') {
        const digitsOnly = cleanValue.replace(/\D/g, '');
        if (digitsOnly.length === 12 || digitsOnly.length === 13) {
          targetValue = digitsOnly.slice(0, 13);
        } else {
          // Fallback to CODE128 if not valid EAN13 digits
          activeFormat = 'CODE128';
        }
      }

      JsBarcode(svgRef.current, targetValue, {
        format: activeFormat,
        width: Math.max(1, width),
        height: Math.max(15, height),
        displayValue: displayValue,
        text: cleanValue,
        fontSize: Math.max(8, fontSize),
        font: fontFamily,
        fontOptions: 'bold',
        textMargin: 2,
        margin: 2,
        background: 'transparent',
        lineColor: lineColor,
        valid: (valid) => {
          if (!valid) {
            setError('Formato inválido');
          } else {
            setError(null);
          }
        }
      });
      setError(null);
    } catch (err: any) {
      // Fallback try with CODE128
      try {
        JsBarcode(svgRef.current, cleanValue, {
          format: 'CODE128',
          width: Math.max(1, width),
          height: Math.max(15, height),
          displayValue: displayValue,
          text: cleanValue,
          fontSize: Math.max(8, fontSize),
          font: fontFamily,
          textMargin: 2,
          margin: 2,
          background: 'transparent',
          lineColor: lineColor
        });
        setError(null);
      } catch (fallbackErr) {
        setError('Erro ao gerar código de barras');
      }
    }
  }, [value, format, width, height, displayValue, fontSize, fontFamily, lineColor]);

  if (error) {
    return (
      <div className={`flex flex-col items-center justify-center p-1 text-center border border-dashed border-amber-300 bg-amber-50/70 rounded text-[10px] text-amber-800 ${className}`}>
        <span className="font-mono font-bold">{value || '---'}</span>
        <span className="text-[9px] text-amber-600">({error})</span>
      </div>
    );
  }

  return (
    <div className={`flex items-center justify-center overflow-hidden max-w-full ${className}`}>
      <svg ref={svgRef} className="max-w-full max-h-full block" />
    </div>
  );
};
