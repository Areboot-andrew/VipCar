import { PrismaClient } from '@prisma/client';
import { notFound } from 'next/navigation';

const prisma = new PrismaClient();

export default async function InvoicePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const invoice = await prisma.invoice.findUnique({
    where: { id },
    include: {
      booking: {
        include: {
          client: true,
          car: true
        }
      }
    }
  });

  if (!invoice) {
    notFound();
  }

  return (
    <div className="bg-white text-black min-h-screen p-8 md:p-16 font-sans">
      <div className="max-w-3xl mx-auto border border-gray-200 shadow-lg p-8 md:p-12 relative bg-white">
        
        {/* Header */}
        <div className="flex justify-between items-start mb-12">
          <div>
            <h1 className="text-4xl font-bold text-gray-900 tracking-tight">INVOICE</h1>
            <p className="text-gray-500 mt-2">#{invoice.id.split('-')[0].toUpperCase()}</p>
          </div>
          <div className="text-right">
            <h2 className="text-xl font-bold text-[#e9c349]">First Line Transfer</h2>
            <p className="text-sm text-gray-500">Premium Transfer Service</p>
            <p className="text-sm text-gray-500">contact@firstline.com</p>
          </div>
        </div>

        {/* Info Grid */}
        <div className="grid grid-cols-2 gap-8 mb-12">
          <div>
            <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-2">Billed To</h3>
            <p className="font-bold text-gray-800">{invoice.booking.client.name}</p>
            <p className="text-gray-600">{invoice.booking.client.email}</p>
            <p className="text-gray-600">{invoice.booking.client.phone || ''}</p>
          </div>
          <div className="text-right">
            <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-2">Invoice Date</h3>
            <p className="font-bold text-gray-800">{invoice.createdAt.toLocaleDateString('uk-UA')}</p>
            
            <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-2 mt-4">Status</h3>
            <p className={`font-bold uppercase ${
              invoice.status === 'PAID' ? 'text-green-600' : 
              invoice.status === 'UNPAID' ? 'text-red-600' : 
              'text-gray-600'
            }`}>
              {invoice.status}
            </p>
          </div>
        </div>

        {/* Trip Details */}
        <div className="mb-12">
          <h3 className="text-lg font-bold text-gray-900 border-b border-gray-200 pb-2 mb-4">Trip Details</h3>
          <table className="w-full text-left">
            <thead>
              <tr className="text-gray-500 text-sm border-b border-gray-100">
                <th className="py-2">Description</th>
                <th className="py-2">Vehicle</th>
                <th className="py-2">Distance</th>
                <th className="py-2 text-right">Total</th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-b border-gray-100">
                <td className="py-4">
                  <p className="font-bold text-gray-800">Transfer Route</p>
                  <p className="text-sm text-gray-600">{invoice.booking.routeFrom} ➔ {invoice.booking.routeTo}</p>
                  <p className="text-xs text-gray-500 mt-1">Pickup: {invoice.booking.dateStart.toLocaleString('uk-UA')}</p>
                </td>
                <td className="py-4 align-top">
                  {invoice.booking.car.make} {invoice.booking.car.model}
                </td>
                <td className="py-4 align-top">
                  {invoice.booking.distance} km
                </td>
                <td className="py-4 align-top text-right font-bold">
                  €{invoice.amount}
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Summary */}
        <div className="flex justify-end mb-12">
          <div className="w-64">
            <div className="flex justify-between py-2 font-bold text-xl border-t-2 border-gray-900">
              <span>Total Due:</span>
              <span>€{invoice.amount}</span>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="border-t border-gray-200 pt-8 text-center text-gray-500 text-sm">
          <p>Thank you for choosing First Line Transfer.</p>
          <p>If you have any questions about this invoice, please contact support.</p>
        </div>

        {/* Print Button (Hidden on Print) */}
        <div className="absolute top-8 right-8 print:hidden" id="print-btn-container">
          <button 
            id="print-btn"
            className="bg-[#080818] text-white px-4 py-2 rounded-lg font-bold uppercase tracking-widest text-xs hover:bg-gray-800 transition-colors"
          >
            Print PDF
          </button>
        </div>
      </div>
      
      {/* Script for Print Button */}
      <script dangerouslySetInnerHTML={{ __html: `
        document.getElementById('print-btn').addEventListener('click', () => window.print());
      `}} />
    </div>
  );
}
