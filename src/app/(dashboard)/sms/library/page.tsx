'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface Book {
  id: string;
  isbn: string;
  title: string;
  author: string;
  publisher?: string;
  category: string;
  totalCopies: number;
  availableCopies: number;
  shelfLocation?: string;
}

interface Circulation {
  id: string;
  bookTitle: string;
  borrowerName: string;
  borrowerType: string;
  borrowDate: string;
  dueDate: string;
  returnDate?: string;
  status: string;
}

export default function LibraryPage() {
  const [books, setBooks] = useState<Book[]>([]);
  const [circulations, setCirculations] = useState<Circulation[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'books' | 'circulation'>('books');
  const [showBookForm, setShowBookForm] = useState(false);
  const [showCirculationForm, setShowCirculationForm] = useState(false);
  const [bookForm, setBookForm] = useState({ isbn: '', title: '', author: '', publisher: '', category: '', totalCopies: '', shelfLocation: '' });
  const [circulationForm, setCirculationForm] = useState({ bookId: '', borrowerName: '', borrowerType: 'STUDENT', dueDate: '' });

  useEffect(() => {
    fetchData();
  }, []);

  async function fetchData() {
    try {
      const [booksRes, circRes] = await Promise.all([
        fetch('/api/sms/library/books'),
        fetch('/api/sms/library/circulations'),
      ]);
      setBooks(await booksRes.json());
      setCirculations(await circRes.json());
    } catch (err) {
      console.error('Failed to fetch library data:', err);
    } finally {
      setLoading(false);
    }
  }

  async function handleAddBook(e: React.FormEvent) {
    e.preventDefault();
    try {
      await fetch('/api/sms/library/books', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...bookForm, totalCopies: parseInt(bookForm.totalCopies), availableCopies: parseInt(bookForm.totalCopies) }),
      });
      setShowBookForm(false);
      setBookForm({ isbn: '', title: '', author: '', publisher: '', category: '', totalCopies: '', shelfLocation: '' });
      fetchData();
    } catch (err) {
      console.error('Failed to add book:', err);
    }
  }

  async function handleBorrow(e: React.FormEvent) {
    e.preventDefault();
    try {
      await fetch('/api/sms/library/circulations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...circulationForm, status: 'BORROWED' }),
      });
      setShowCirculationForm(false);
      setCirculationForm({ bookId: '', borrowerName: '', borrowerType: 'STUDENT', dueDate: '' });
      fetchData();
    } catch (err) {
      console.error('Failed to borrow book:', err);
    }
  }

  async function returnBook(id: string) {
    try {
      await fetch(`/api/sms/library/circulations/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'RETURNED', returnDate: new Date().toISOString().split('T')[0] }),
      });
      fetchData();
    } catch (err) {
      console.error('Failed to return book:', err);
    }
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold dark:text-white">Library Management</h1>

      <div className="flex gap-4 border-b dark:border-gray-700">
        <button className={`px-4 py-2 dark:text-gray-300 ${activeTab === 'books' ? 'border-b-2 border-blue-500 font-bold' : ''}`} onClick={() => setActiveTab('books')}>Books</button>
        <button className={`px-4 py-2 dark:text-gray-300 ${activeTab === 'circulation' ? 'border-b-2 border-blue-500 font-bold' : ''}`} onClick={() => setActiveTab('circulation')}>Circulation</button>
      </div>

      {activeTab === 'books' && (
        <>
          <div className="flex justify-between">
            <h2 className="text-xl font-semibold dark:text-white">Books</h2>
            <Button onClick={() => setShowBookForm(!showBookForm)}>{showBookForm ? 'Cancel' : 'Add Book'}</Button>
          </div>
          {showBookForm && (
            <Card className="dark:bg-gray-800">
              <CardHeader><CardTitle className="dark:text-white">Add New Book</CardTitle></CardHeader>
              <CardContent>
                <form onSubmit={handleAddBook} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <Input placeholder="ISBN" value={bookForm.isbn} onChange={e => setBookForm({...bookForm, isbn: e.target.value})} required />
                    <Input placeholder="Title" value={bookForm.title} onChange={e => setBookForm({...bookForm, title: e.target.value})} required />
                    <Input placeholder="Author" value={bookForm.author} onChange={e => setBookForm({...bookForm, author: e.target.value})} required />
                    <Input placeholder="Publisher" value={bookForm.publisher} onChange={e => setBookForm({...bookForm, publisher: e.target.value})} />
                    <Input placeholder="Category" value={bookForm.category} onChange={e => setBookForm({...bookForm, category: e.target.value})} required />
                    <Input type="number" placeholder="Total Copies" value={bookForm.totalCopies} onChange={e => setBookForm({...bookForm, totalCopies: e.target.value})} required />
                    <Input placeholder="Shelf Location" value={bookForm.shelfLocation} onChange={e => setBookForm({...bookForm, shelfLocation: e.target.value})} />
                  </div>
                  <Button type="submit">Add Book</Button>
                </form>
              </CardContent>
            </Card>
          )}
          <Card className="dark:bg-gray-800">
            <CardContent className="pt-6">
              {loading ? <p className="dark:text-gray-300">Loading...</p> : circulations.length === 0 ? <p className="text-gray-500 dark:text-gray-400">No circulation records found.</p> : (
                <table className="w-full">
                  <thead>
                    <tr className="border-b dark:border-gray-700">
                      <th className="text-left py-2 dark:text-gray-300">Book</th>
                      <th className="text-left py-2 dark:text-gray-300">Borrower</th>
                      <th className="text-left py-2 dark:text-gray-300">Borrowed</th>
                      <th className="text-left py-2 dark:text-gray-300">Due</th>
                      <th className="text-left py-2 dark:text-gray-300">Status</th>
                      <th className="text-left py-2 dark:text-gray-300">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {circulations.map(circ => (
                      <tr key={circ.id} className="border-b dark:border-gray-700 dark:text-gray-300">
                        <td className="py-2">{circ.bookTitle}</td>
                        <td className="py-2">{circ.borrowerName}</td>
                        <td className="py-2">{circ.borrowDate}</td>
                        <td className="py-2">{circ.dueDate}</td>
                        <td className="py-2"><Badge>{circ.status}</Badge></td>
                        <td className="py-2">{circ.status === 'BORROWED' && <Button size="sm" onClick={() => returnBook(circ.id)}>Return</Button>}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </CardContent>
          </Card>
        </>
      )}

      {activeTab === 'circulation' && (
        <>
          <div className="flex justify-between">
            <h2 className="text-xl font-semibold dark:text-white">Circulation</h2>
            <Button onClick={() => setShowCirculationForm(!showCirculationForm)}>{showCirculationForm ? 'Cancel' : 'Borrow Book'}</Button>
          </div>
          {showCirculationForm && (
            <Card className="dark:bg-gray-800">
              <CardHeader><CardTitle className="dark:text-white">Borrow Book</CardTitle></CardHeader>
              <CardContent>
                <form onSubmit={handleBorrow} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <select className="border rounded px-3 py-2 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-200" value={circulationForm.bookId} onChange={e => setCirculationForm({...circulationForm, bookId: e.target.value})} required>
                      <option value="">Select Book</option>
                      {books.map(b => <option key={b.id} value={b.id}>{b.title}</option>)}
                    </select>
                    <Input placeholder="Borrower Name" value={circulationForm.borrowerName} onChange={e => setCirculationForm({...circulationForm, borrowerName: e.target.value})} required />
                    <select className="border rounded px-3 py-2 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-200" value={circulationForm.borrowerType} onChange={e => setCirculationForm({...circulationForm, borrowerType: e.target.value})}>
                      <option value="STUDENT">Student</option>
                      <option value="TEACHER">Teacher</option>
                      <option value="STAFF">Staff</option>
                    </select>
                    <Input type="date" placeholder="Due Date" value={circulationForm.dueDate} onChange={e => setCirculationForm({...circulationForm, dueDate: e.target.value})} required />
                  </div>
                  <Button type="submit">Borrow</Button>
                </form>
              </CardContent>
            </Card>
          )}
          <Card className="dark:bg-gray-800">
            <CardHeader><CardTitle className="dark:text-white">Borrowed Books</CardTitle></CardHeader>
            <CardContent>
              {loading ? <p>Loading...</p> : circulations.length === 0 ? <p className="text-gray-500">No circulation records found.</p> : (
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-2">Book</th>
                      <th className="text-left py-2">Borrower</th>
                      <th className="text-left py-2">Borrowed</th>
                      <th className="text-left py-2">Due</th>
                      <th className="text-left py-2">Status</th>
                      <th className="text-left py-2">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {circulations.map(circ => (
                      <tr key={circ.id} className="border-b">
                        <td className="py-2">{circ.bookTitle}</td>
                        <td className="py-2">{circ.borrowerName}</td>
                        <td className="py-2">{circ.borrowDate}</td>
                        <td className="py-2">{circ.dueDate}</td>
                        <td className="py-2"><Badge>{circ.status}</Badge></td>
                        <td className="py-2">{circ.status === 'BORROWED' && <Button size="sm" onClick={() => returnBook(circ.id)}>Return</Button>}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
