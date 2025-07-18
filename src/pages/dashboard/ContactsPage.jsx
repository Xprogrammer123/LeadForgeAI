import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { motion } from 'framer-motion';
import DashboardLayout from '../../components/dashboard/DashboardLayout';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import Icon from '../../components/AppIcon';
import contactService from '../../utils/contactService';

function ContactsPage() {
  const [contacts, setContacts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [newContact, setNewContact] = useState({
    name: '',
    email: '',
    company: '',
    title: '',
    linkedin_url: ''
  });
  const { user } = useAuth();

  useEffect(() => {
    loadContacts();
  }, []);

  const loadContacts = async () => {
    try {
      setLoading(true);
      const result = await contactService.getContacts();
      
      if (result?.success) {
        setContacts(result.data);
      } else {
        setError(result?.error || 'Failed to load contacts');
      }
    } catch (err) {
      setError('Failed to load contacts');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateContact = async (e) => {
    e.preventDefault();
    try {
      const contactData = {
        ...newContact,
        user_id: user.id
      };
      
      const result = await contactService.createContact(contactData);
      
      if (result?.success) {
        setContacts([result.data, ...contacts]);
        setNewContact({ name: '', email: '', company: '', title: '', linkedin_url: '' });
        setShowModal(false);
      } else {
        setError(result?.error || 'Failed to create contact');
      }
    } catch (err) {
      setError('Failed to create contact');
    }
  };

  const handleDeleteContact = async (contactId) => {
    if (!window.confirm('Are you sure you want to delete this contact?')) {
      return;
    }

    try {
      const result = await contactService.deleteContact(contactId);
      
      if (result?.success) {
        setContacts(contacts.filter(contact => contact.id !== contactId));
      } else {
        setError(result?.error || 'Failed to delete contact');
      }
    } catch (err) {
      setError('Failed to delete contact');
    }
  };

  const filteredContacts = contacts.filter(contact =>
    contact.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    contact.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    contact.company?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <DashboardLayout title="Contacts" currentPath="/contacts">
      <div className="space-y-8">
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="glassmorphism rounded-lg p-4 border border-error/20 bg-error/10"
          >
            <div className="text-sm text-error font-body-medium">{error}</div>
          </motion.div>
        )}

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h2 className="text-2xl font-headline-bold text-foreground">
              Contact Management
            </h2>
            <p className="text-muted-foreground font-body">
              Manage your prospect contacts and leads
            </p>
          </div>
          <div className="flex space-x-3">
            <Button
              variant="outline"
              iconName="Upload"
              iconPosition="left"
            >
              Import CSV
            </Button>
            <Button
              onClick={() => setShowModal(true)}
              variant="default"
              className="cta-button"
              iconName="Plus"
              iconPosition="left"
            >
              Add Contact
            </Button>
          </div>
        </div>

        {/* Search */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="glassmorphism rounded-xl p-6"
        >
          <div className="flex items-center space-x-2 mb-4">
            <Icon name="Search" size={20} color="var(--color-muted-foreground)" />
            <Input
              type="text"
              placeholder="Search contacts..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="flex-1 bg-transparent border-none focus:ring-0"
            />
          </div>
        </motion.div>

        {/* Contacts Table */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="glassmorphism rounded-xl overflow-hidden"
        >
          <div className="p-6 border-b border-border">
            <h3 className="text-lg font-headline-bold text-foreground">
              Your Contacts
            </h3>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left py-4 px-6 text-sm font-body-semibold text-muted-foreground">
                    Name
                  </th>
                  <th className="text-left py-4 px-6 text-sm font-body-semibold text-muted-foreground">
                    Email
                  </th>
                  <th className="text-left py-4 px-6 text-sm font-body-semibold text-muted-foreground">
                    Company
                  </th>
                  <th className="text-left py-4 px-6 text-sm font-body-semibold text-muted-foreground">
                    Title
                  </th>
                  <th className="text-left py-4 px-6 text-sm font-body-semibold text-muted-foreground">
                    Status
                  </th>
                  <th className="text-left py-4 px-6 text-sm font-body-semibold text-muted-foreground">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan="6" className="py-8 text-center">
                      <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
                      <p className="text-muted-foreground font-body-medium">Loading contacts...</p>
                    </td>
                  </tr>
                ) : filteredContacts.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="py-8 text-center">
                      <Icon name="Users" size={48} color="var(--color-muted-foreground)" className="mx-auto mb-2" />
                      <p className="text-muted-foreground font-body-medium">No contacts found</p>
                    </td>
                  </tr>
                ) : (
                  filteredContacts.map((contact) => (
                    <tr key={contact.id} className="border-b border-border hover:bg-muted/5 transition-colors">
                      <td className="py-4 px-6">
                        <div className="font-body-semibold text-foreground">
                          {contact.name}
                        </div>
                      </td>
                      <td className="py-4 px-6">
                        <div className="text-sm text-muted-foreground">
                          {contact.email}
                        </div>
                      </td>
                      <td className="py-4 px-6">
                        <div className="text-sm text-foreground">
                          {contact.company}
                        </div>
                      </td>
                      <td className="py-4 px-6">
                        <div className="text-sm text-muted-foreground">
                          {contact.title}
                        </div>
                      </td>
                      <td className="py-4 px-6">
                        <span className="px-3 py-1 text-xs font-body-medium rounded-full bg-success/20 text-success border border-success/30">
                          Active
                        </span>
                      </td>
                      <td className="py-4 px-6">
                        <div className="flex space-x-2">
                          <Button
                            size="sm"
                            variant="outline"
                            iconName="Edit"
                          >
                            Edit
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleDeleteContact(contact.id)}
                            className="text-error hover:text-error-foreground hover:bg-error/10"
                            iconName="Trash"
                          >
                            Delete
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </motion.div>
      </div>

      {/* Create Contact Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center z-50">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="glassmorphism rounded-xl p-6 w-full max-w-md mx-4"
          >
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-headline-bold text-foreground">
                Add New Contact
              </h3>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowModal(false)}
                iconName="X"
              />
            </div>
            
            <form onSubmit={handleCreateContact} className="space-y-4">
              <div>
                <label className="block text-sm font-body-semibold text-foreground mb-2">
                  Name
                </label>
                <Input
                  type="text"
                  required
                  value={newContact.name}
                  onChange={(e) => setNewContact({...newContact, name: e.target.value})}
                  placeholder="Enter contact name"
                />
              </div>
              
              <div>
                <label className="block text-sm font-body-semibold text-foreground mb-2">
                  Email
                </label>
                <Input
                  type="email"
                  required
                  value={newContact.email}
                  onChange={(e) => setNewContact({...newContact, email: e.target.value})}
                  placeholder="Enter email address"
                />
              </div>
              
              <div>
                <label className="block text-sm font-body-semibold text-foreground mb-2">
                  Company
                </label>
                <Input
                  type="text"
                  value={newContact.company}
                  onChange={(e) => setNewContact({...newContact, company: e.target.value})}
                  placeholder="Enter company name"
                />
              </div>
              
              <div>
                <label className="block text-sm font-body-semibold text-foreground mb-2">
                  Title
                </label>
                <Input
                  type="text"
                  value={newContact.title}
                  onChange={(e) => setNewContact({...newContact, title: e.target.value})}
                  placeholder="Enter job title"
                />
              </div>
              
              <div>
                <label className="block text-sm font-body-semibold text-foreground mb-2">
                  LinkedIn URL
                </label>
                <Input
                  type="url"
                  value={newContact.linkedin_url}
                  onChange={(e) => setNewContact({...newContact, linkedin_url: e.target.value})}
                  placeholder="Enter LinkedIn profile URL"
                />
              </div>
              
              <div className="flex justify-end space-x-3 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowModal(false)}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="default"
                  className="cta-button"
                >
                  Add Contact
                </Button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </DashboardLayout>
  );
}

export default ContactsPage;