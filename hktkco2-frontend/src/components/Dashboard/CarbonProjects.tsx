import React, { useState, useEffect } from 'react';
import { Plus, TreePine, Search, Filter, CheckCircle, Clock } from 'lucide-react';
import { useAccount } from 'wagmi';
import useContract from '../../contracts/hooks/useContract';

interface Project {
  id: string;
  name: string;
  location: string;
  methodology: string;
  totalCredits: number;
  issuedCredits: number;
  status: 'active' | 'pending' | 'verified';
  verificationDate?: string;
}

const CarbonProjects: React.FC = () => {
  const { address, isConnected } = useAccount();
  const { carbonRegistry } = useContract();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'pending' | 'verified'>('all');

  // Mock data for demonstration
  const mockProjects: Project[] = [
    {
      id: 'VCS-1234',
      name: 'Amazon Rainforest Conservation',
      location: 'Brazil',
      methodology: 'REDD+',
      totalCredits: 10000,
      issuedCredits: 7500,
      status: 'active',
      verificationDate: '2024-01-15',
    },
    {
      id: 'CDM-5678',
      name: 'Solar Farm India',
      location: 'Rajasthan, India',
      methodology: 'CDM',
      totalCredits: 5000,
      issuedCredits: 3000,
      status: 'verified',
      verificationDate: '2024-02-20',
    },
    {
      id: 'GS-9012',
      name: 'Wind Power Kenya',
      location: 'Kenya',
      methodology: 'Gold Standard',
      totalCredits: 8000,
      issuedCredits: 0,
      status: 'pending',
    },
  ];

  useEffect(() => {
    fetchProjects();
  }, [isConnected, carbonRegistry]);

  const fetchProjects = async () => {
    setLoading(true);
    try {
      // TODO: Fetch actual projects from registry
      setProjects(mockProjects);
    } catch (error) {
      console.error('Error fetching projects:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredProjects = projects.filter(project => {
    const matchesSearch = project.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         project.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         project.location.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = filterStatus === 'all' || project.status === filterStatus;
    return matchesSearch && matchesFilter;
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return (
          <span className="flex items-center space-x-1 text-green-600 bg-green-100 px-3 py-1 rounded-full text-sm">
            <CheckCircle className="h-4 w-4" />
            <span>Active</span>
          </span>
        );
      case 'verified':
        return (
          <span className="flex items-center space-x-1 text-blue-600 bg-blue-100 px-3 py-1 rounded-full text-sm">
            <CheckCircle className="h-4 w-4" />
            <span>Verified</span>
          </span>
        );
      case 'pending':
        return (
          <span className="flex items-center space-x-1 text-yellow-600 bg-yellow-100 px-3 py-1 rounded-full text-sm">
            <Clock className="h-4 w-4" />
            <span>Pending</span>
          </span>
        );
      default:
        return null;
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-3">
          <TreePine className="h-6 w-6 text-green-500" />
          <h2 className="text-xl font-bold text-gray-900">Carbon Projects</h2>
        </div>
        <button className="flex items-center space-x-2 bg-green-500 text-white px-4 py-2 rounded-lg hover:bg-green-600 transition-colors">
          <Plus className="h-5 w-5" />
          <span>Register New</span>
        </button>
      </div>

      {/* Search and Filter */}
      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
          <input
            type="text"
            placeholder="Search projects..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
          />
        </div>
        <div className="flex items-center space-x-2">
          <Filter className="h-5 w-5 text-gray-500" />
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value as any)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
          >
            <option value="all">All Projects</option>
            <option value="active">Active</option>
            <option value="verified">Verified</option>
            <option value="pending">Pending</option>
          </select>
        </div>
      </div>

      {/* Projects List */}
      {loading ? (
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-green-500"></div>
        </div>
      ) : filteredProjects.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          <TreePine className="h-12 w-12 text-gray-300 mx-auto mb-3" />
          <p>No projects found</p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredProjects.map((project) => (
            <div
              key={project.id}
              className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center space-x-3 mb-2">
                    <h3 className="text-lg font-semibold text-gray-900">{project.name}</h3>
                    {getStatusBadge(project.status)}
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div>
                      <p className="text-gray-500">Project ID</p>
                      <p className="font-medium">{project.id}</p>
                    </div>
                    <div>
                      <p className="text-gray-500">Location</p>
                      <p className="font-medium">{project.location}</p>
                    </div>
                    <div>
                      <p className="text-gray-500">Methodology</p>
                      <p className="font-medium">{project.methodology}</p>
                    </div>
                    <div>
                      <p className="text-gray-500">Credits Issued</p>
                      <p className="font-medium">{project.issuedCredits.toLocaleString()} / {project.totalCredits.toLocaleString()}</p>
                    </div>
                  </div>
                  {project.verificationDate && (
                    <p className="text-sm text-gray-500 mt-2">
                      Verified on: {new Date(project.verificationDate).toLocaleDateString()}
                    </p>
                  )}
                </div>
                <button className="ml-4 text-blue-600 hover:text-blue-700 text-sm font-medium">
                  View Details →
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default CarbonProjects;