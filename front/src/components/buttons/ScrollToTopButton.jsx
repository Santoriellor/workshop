import { useState, useEffect } from 'react'
// Contexts
import { useGlobalContext } from '../../contexts/GlobalContext'
// Styles
import '../../styles/ScrollToTopButton.css'

const ScrollToTopButton = () => {
  const { modalState } = useGlobalContext()
  const [visible, setVisible] = useState(false)

  // Show button when scrolled down
  useEffect(() => {
    const scrollableDiv = document.querySelector('.content')
    if (!scrollableDiv) return

    const handleScroll = () => {
      const shouldBeVisible =
        scrollableDiv.scrollTop > 200 && !modalState.showModal && !modalState.showDeleteModal
      setVisible(shouldBeVisible)
    }

    scrollableDiv.addEventListener('scroll', handleScroll)

    // Run once on mount to set initial visibility
    handleScroll()

    return () => scrollableDiv.removeEventListener('scroll', handleScroll)
  }, [modalState.showModal, modalState.showDeleteModal])

  /*  useEffect(() => {
    // Select the correct scrolling container
    const scrollableDiv = document.querySelector(".content");
    if (!scrollableDiv) return;

    const handleScroll = () => {
      setVisible(scrollableDiv.scrollTop > 300);
    };

    scrollableDiv.addEventListener("scroll", handleScroll);

    return () => scrollableDiv.removeEventListener("scroll", handleScroll);
  }, []);

  // Hide buttom when modal is open
  useEffect(() => {
    if (modalState.showModal || modalState.showDeleteModal) {
      setVisible(false);
    } else {
      setVisible(true);
    }
  }, [modalState.showModal, modalState.showDeleteModal]); */

  // Scroll to top function
  const scrollToTop = () => {
    const scrollableDiv = document.querySelector('.content')
    if (scrollableDiv) {
      scrollableDiv.scrollTo({ top: 0, behavior: 'smooth' })
    }
  }

  return (
    <div className={`scroll-to-top-container${visible ? ' show' : ''}`}>
      <button type="button" className="scroll-to-top">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="currentColor"
          className="icon"
          onClick={scrollToTop}
        >
          <path
            d="M12 22.4199C17.5228 22.4199 22 17.9428 22 12.4199C22 6.89707 17.5228 2.41992 12 2.41992C6.47715 2.41992 2 6.89707 2 12.4199C2 17.9428 6.47715 22.4199 12 22.4199Z"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d="M8 13.8599L10.87 10.8C11.0125 10.6416 11.1868 10.5149 11.3815 10.4282C11.5761 10.3415 11.7869 10.2966 12 10.2966C12.2131 10.2966 12.4239 10.3415 12.6185 10.4282C12.8132 10.5149 12.9875 10.6416 13.13 10.8L16 13.8599"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </button>
    </div>
  )
}

export default ScrollToTopButton
