import { useState, useEffect } from 'react';
import api from '../api/axios.js';
import { 
  KanbanSquare, CheckCircle2, Circle, Clock, Camera,
  Film, FileImage, Send, DollarSign, Package, Users,
  Settings, X
} from 'lucide-react';
import { parseSafeDate } from '../utils/dateFormatter.js';
import toast from 'react-hot-toast';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';

const COLUMNS = ['To-Do', 'In-Progress', 'Editing', 'Printed', 'Delivered'];

export default function OperationsBoard() {
  const [operations, setOperations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedOp, setSelectedOp] = useState(null);

  const fetchOperations = async () => {
    try {
      const res = await api.get('/operations');
      setOperations(res.data);
    } catch (err) {
      toast.error('Failed to fetch operations');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOperations();
  }, []);

  const onDragEnd = async (result) => {
    const { destination, source, draggableId } = result;

    if (!destination) return;
    if (destination.droppableId === source.droppableId && destination.index === source.index) return;

    const opId = draggableId;
    const newStage = destination.droppableId;
    
    // Optimistic UI update
    setOperations(ops => ops.map(op => 
      op._id === opId ? { ...op, stage: newStage } : op
    ));

    try {
      // The backend expects the invoice ID in the URL to find the operation
      const op = operations.find(o => o._id === opId);
      if (op) {
        await api.patch(`/operations/${op.invoice._id}`, { stage: newStage });
        toast.success(`Moved to ${newStage}`);
      }
    } catch (err) {
      toast.error('Failed to move item');
      fetchOperations(); // Revert on failure
    }
  };

  // Group operations by stage
  const columnsData = COLUMNS.reduce((acc, col) => {
    acc[col] = operations.filter(op => op.stage === col);
    return acc;
  }, {});

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="p-2 bg-indigo-100 text-indigo-600 rounded-lg">
          <KanbanSquare size={24} />
        </div>
        <div>
          <h1 className="text-xl font-bold text-slate-800">Operations Hub</h1>
          <p className="text-sm text-slate-500">Track and manage event production workflows.</p>
        </div>
      </div>

      {loading ? (
        <div className="animate-pulse flex gap-4 overflow-x-auto pb-4">
          {[1,2,3,4,5].map(i => (
            <div key={i} className="min-w-[280px] bg-slate-100 h-96 rounded-xl border border-slate-200"></div>
          ))}
        </div>
      ) : (
        <DragDropContext onDragEnd={onDragEnd}>
          <div className="flex gap-6 overflow-x-auto pb-4 items-start min-h-[calc(100vh-200px)]">
            {COLUMNS.map(col => (
              <div key={col} className="min-w-[280px] w-[280px] flex-shrink-0 bg-slate-50 rounded-xl border border-slate-200 flex flex-col max-h-full">
                <div className="p-3 border-b border-slate-200 bg-white rounded-t-xl flex justify-between items-center shadow-sm">
                  <h3 className="font-bold text-slate-700 text-sm uppercase tracking-wider">{col}</h3>
                  <span className="bg-slate-100 text-slate-600 text-xs font-bold px-2 py-0.5 rounded-full">
                    {columnsData[col].length}
                  </span>
                </div>
                
                <Droppable droppableId={col}>
                  {(provided, snapshot) => (
                    <div 
                      ref={provided.innerRef}
                      {...provided.droppableProps}
                      className={`p-3 flex-1 overflow-y-auto space-y-3 transition-colors ${snapshot.isDraggingOver ? 'bg-indigo-50/50' : ''}`}
                    >
                      {columnsData[col].map((op, index) => (
                        <Draggable key={op._id} draggableId={op._id} index={index}>
                          {(provided, snapshot) => (
                            <div
                              ref={provided.innerRef}
                              {...provided.draggableProps}
                              {...provided.dragHandleProps}
                              onClick={() => setSelectedOp(op)}
                              className={`bg-white p-4 rounded-xl border ${snapshot.isDragging ? 'border-indigo-400 shadow-xl scale-105' : 'border-slate-200 shadow-sm hover:shadow-md hover:border-indigo-300'} transition-all cursor-pointer group`}
                            >
                              <div className="flex justify-between items-start mb-2">
                                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{op.invoice?.invoiceNo}</span>
                                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${op.invoice?.status === 'paid' ? 'bg-emerald-100 text-emerald-700' : 'bg-orange-100 text-orange-700'}`}>
                                  {op.invoice?.status}
                                </span>
                              </div>
                              <h4 className="font-bold text-slate-800 text-sm mb-1 line-clamp-1">{op.invoice?.customer?.name}</h4>
                              <p className="text-xs text-slate-500 font-medium mb-3">{op.invoice?.eventCategoryName || op.invoice?.event || 'Unknown Event'}</p>
                              
                              <div className="flex items-center gap-2 text-[11px] text-slate-400">
                                <Clock size={12} />
                                {op.invoice?.eventDate ? parseSafeDate(op.invoice.eventDate).toLocaleDateString('en-IN') : 'Date TBD'}
                              </div>
                            </div>
                          )}
                        </Draggable>
                      ))}
                      {provided.placeholder}
                    </div>
                  )}
                </Droppable>
              </div>
            ))}
          </div>
        </DragDropContext>
      )}

      {selectedOp && (
        <ChecklistModal 
          op={selectedOp} 
          onClose={() => setSelectedOp(null)} 
          onUpdate={(updatedOp) => {
            setOperations(ops => ops.map(o => o._id === updatedOp._id ? updatedOp : o));
            setSelectedOp(updatedOp);
          }}
        />
      )}
    </div>
  );
}

function ChecklistModal({ op, onClose, onUpdate }) {
  const [loading, setLoading] = useState(false);

  const toggleCheck = async (field, currentValue) => {
    setLoading(true);
    try {
      const res = await api.patch(`/operations/${op.invoice._id}`, { [field]: !currentValue });
      onUpdate({ ...op, ...res.data, invoice: op.invoice });
    } catch (err) {
      toast.error('Update failed');
    } finally {
      setLoading(false);
    }
  };

  const STEPS = [
    {
      phase: 'Pre-Event Preparation',
      icon: Settings,
      color: 'text-indigo-500',
      bg: 'bg-indigo-100',
      items: [
        { key: 'advanceCleared', label: 'Advance Payment Cleared', icon: DollarSign },
        { key: 'staffAssigned', label: 'Staff & Crew Assigned', icon: Users },
        { key: 'equipmentCheck', label: 'Equipment Checked & Packed', icon: Camera },
      ]
    },
    {
      phase: 'Event Day Execution',
      icon: Camera,
      color: 'text-orange-500',
      bg: 'bg-orange-100',
      items: [
        { key: 'attendanceLog', label: 'Crew Attendance Logged', icon: Clock },
        { key: 'rawFootageBackup', label: 'Raw Footage Backup Started', icon: Film },
      ]
    },
    {
      phase: 'Post-Event Delivery',
      icon: Package,
      color: 'text-emerald-500',
      bg: 'bg-emerald-100',
      items: [
        { key: 'selectionLinkSent', label: 'Photo Selection Link Sent', icon: Send },
        { key: 'photoEditingComplete', label: 'Photo Editing Complete', icon: FileImage },
        { key: 'videoMixingComplete', label: 'Video Mixing Complete', icon: Film },
        { key: 'albumPrinting', label: 'Album Printed', icon: Package },
        { key: 'finalDelivery', label: 'Final Delivery & Payment Cleared', icon: CheckCircle2 },
      ]
    }
  ];

  return (
    <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-5 border-b border-slate-100 flex justify-between items-center bg-slate-50">
          <div>
            <h2 className="font-bold text-slate-800 text-lg">{op.invoice?.customer?.name}'s Event</h2>
            <p className="text-xs text-slate-500 font-medium">#{op.invoice?.invoiceNo} • {op.stage}</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-200 rounded-full transition-colors text-slate-500">
            <X size={20} />
          </button>
        </div>

        {/* Stepper Content */}
        <div className="p-6 overflow-y-auto flex-1">
          <div className="relative space-y-8 before:absolute before:inset-0 before:ml-5 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-slate-200 before:to-transparent">
            
            {STEPS.map((step, sIdx) => {
              const PhaseIcon = step.icon;
              const isPhaseComplete = step.items.every(item => op[item.key]);
              
              return (
                <div key={sIdx} className="relative z-10">
                  <div className="flex items-center gap-3 mb-4">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center shadow-sm ${isPhaseComplete ? step.bg : 'bg-white border-2 border-slate-200'} transition-colors`}>
                      <PhaseIcon size={18} className={isPhaseComplete ? step.color : 'text-slate-400'} />
                    </div>
                    <h3 className={`font-bold ${isPhaseComplete ? 'text-slate-800' : 'text-slate-500'}`}>{step.phase}</h3>
                  </div>
                  
                  <div className="ml-5 pl-8 space-y-3">
                    {step.items.map((item, iIdx) => {
                      const ItemIcon = item.icon;
                      const isChecked = op[item.key];
                      return (
                        <button
                          key={iIdx}
                          disabled={loading}
                          onClick={() => toggleCheck(item.key, isChecked)}
                          className={`w-full flex items-center gap-3 p-3 rounded-xl border text-left transition-all ${isChecked ? 'bg-slate-50 border-emerald-200 shadow-sm' : 'bg-white border-slate-100 hover:border-slate-300 hover:shadow-sm'}`}
                        >
                          <div className={isChecked ? 'text-emerald-500' : 'text-slate-300'}>
                            {isChecked ? <CheckCircle2 size={20} /> : <Circle size={20} />}
                          </div>
                          <div className={`flex-1 font-medium text-sm ${isChecked ? 'text-slate-700' : 'text-slate-500'}`}>
                            {item.label}
                          </div>
                          <ItemIcon size={16} className={isChecked ? 'text-slate-400' : 'text-slate-300 opacity-50'} />
                        </button>
                      );
                    })}
                  </div>
                </div>
              );
            })}
            
          </div>
        </div>
      </div>
    </div>
  );
}
